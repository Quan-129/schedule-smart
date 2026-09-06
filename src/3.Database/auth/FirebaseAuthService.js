/**
 * ==========================================================================
 * DATABASE & AUTH SERVICE - FIREBASE AUTH & CLOUD FIRESTORE SYNC
 * Quản lý đăng nhập Google OAuth & đồng bộ dữ liệu đa thiết bị qua Cloud
 * ==========================================================================
 */

import { state, persistDriveSubjects, persistGrades, initApplicationState } from '../state.js';
import { showToast } from '../../1.Frontend/components/Toast.js';

export const firebaseConfig = {
  apiKey: "AIzaSyDfFsMGvFKQSOk1HgzT-QtNc66thwjEOLE",
  authDomain: "schedule-smart-ee05e.firebaseapp.com",
  projectId: "schedule-smart-ee05e",
  storageBucket: "schedule-smart-ee05e.firebasestorage.app",
  messagingSenderId: "1036082312669",
  appId: "1:1036082312669:web:0b3d8d2fedeeedf889f234",
  measurementId: "G-9CE6MNZT5Z"
};

export const OWNER_EMAILS = [
  'minhquan12092005@gmail.com'
];

let firebaseApp = null;
let auth = null;
let db = null;
let currentUser = null;
let firestoreUnsubscribe = null;

/**
 * Kiểm tra xem tài khoản hiện tại có phải là Chủ Sở Hữu (Admin) hay không
 * @param {Object|null} user 
 * @returns {boolean}
 */
export function isOwnerUser(user = currentUser) {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();
  return OWNER_EMAILS.some(e => e.toLowerCase().trim() === email);
}

/**
 * Lấy đối tượng người dùng hiện tại
 * @returns {Object|null}
 */
export function getCurrentUser() {
  return currentUser;
}

let globalAuthCallback = null;

/**
 * Khởi tạo Firebase Authentication & Firestore Listener
 * @param {Function} onAuthChangedCallback - Callback khi trạng thái đăng nhập thay đổi
 */
export function initFirebaseAuth(onAuthChangedCallback) {
  globalAuthCallback = onAuthChangedCallback;

  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
      } else {
        firebaseApp = firebase.app();
      }
      auth = firebase.auth();
      db = firebase.firestore();
    }
  } catch (err) {
    console.warn('[FirebaseAuth] Lỗi khởi tạo Firebase:', err);
  }

  // 1. Kiểm tra Local Owner Session trước
  const localAuthRaw = localStorage.getItem('smart_schedule_local_auth');
  if (localAuthRaw) {
    try {
      const localUser = JSON.parse(localAuthRaw);
      if (localUser && localUser.email) {
        currentUser = localUser;
        updateAuthUI(localUser);
        if (typeof onAuthChangedCallback === 'function') {
          onAuthChangedCallback(localUser);
        }
      }
    } catch (e) { }
  }

  // Gắn sự kiện click các nút đăng nhập / khách / đăng xuất
  bindAuthButtonEvents();

  if (auth) {
    // 2. Kiểm tra kết quả Redirect nếu trình duyệt vừa quay lại từ Google Login
    auth.getRedirectResult().then((result) => {
      if (result && result.user) {
        currentUser = result.user;
        localStorage.removeItem('smart_schedule_guest_mode');
        localStorage.removeItem('smart_schedule_local_auth');
        updateAuthUI(result.user);
        showToast(`Đăng nhập thành công! Xin chào ${result.user.displayName || 'bạn'}.`);
        if (typeof onAuthChangedCallback === 'function') {
          onAuthChangedCallback(result.user);
        }
      }
    }).catch((err) => {
      console.warn('[FirebaseAuth] getRedirectResult error:', err);
    });

    // 3. Lắng nghe trạng thái đăng nhập Firebase
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUser = user;
        localStorage.removeItem('smart_schedule_guest_mode');
        localStorage.removeItem('smart_schedule_local_auth');
        updateAuthUI(user);
        attachFirestoreListener(user.uid, onAuthChangedCallback);
        showToast(`Xin chào, ${user.displayName || 'bạn'}! Đã kết nối Cloud.`);
        if (typeof onAuthChangedCallback === 'function') {
          onAuthChangedCallback(user);
        }
      } else {
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
          firestoreUnsubscribe = null;
        }

        const localAuth = localStorage.getItem('smart_schedule_local_auth');
        if (localAuth) return; // Giữ nguyên local auth nếu có

        // Nếu đã từng chọn chế độ khách trước đó, tự động mở app
        const isGuest = localStorage.getItem('smart_schedule_guest_mode') === 'true';
        if (isGuest) {
          currentUser = null;
          updateAuthUI({ displayName: 'Khách (Offline)', isAnonymous: true });
        } else {
          currentUser = null;
          updateAuthUI(null);
        }

        if (typeof onAuthChangedCallback === 'function') {
          onAuthChangedCallback(null);
        }
      }
    });
  } else {
    // Không có kết nối Firebase SDK -> Chạy chế độ Offline LocalStorage
    console.log('[FirebaseAuth] Chạy chế độ Offline LocalStorage');
    const localAuth = localStorage.getItem('smart_schedule_local_auth');
    if (!localAuth) {
      updateAuthUI({ displayName: 'Khách', isAnonymous: true });
      if (typeof onAuthChangedCallback === 'function') {
        onAuthChangedCallback(null);
      }
    }
  }
}

/**
 * Gắn sự kiện click các nút đăng nhập trong ứng dụng
 */
export function bindAuthButtonEvents() {
  const landingLoginBtn = document.getElementById('landing-login-btn');
  const landingGuestBtn = document.getElementById('landing-guest-btn');
  const landingOwnerBtn = document.getElementById('landing-owner-fast-btn');
  const landingRedirectBtn = document.getElementById('landing-redirect-login-btn');
  const authLoginBtn = document.getElementById('auth-login-btn');
  const authLogoutBtn = document.getElementById('auth-logout-btn');

  if (landingLoginBtn) landingLoginBtn.onclick = handleGoogleLogin;
  if (landingGuestBtn) landingGuestBtn.onclick = handleGuestLogin;
  if (landingOwnerBtn) landingOwnerBtn.onclick = handleOwnerFastLogin;
  if (landingRedirectBtn) landingRedirectBtn.onclick = handleGoogleRedirectLogin;
  if (authLoginBtn) authLoginBtn.onclick = handleGoogleLogin;
  if (authLogoutBtn) authLogoutBtn.onclick = handleLogout;
}

/**
 * Đăng nhập nhanh với quyền Chủ Sở Hữu (Minh Quân)
 */
export function handleOwnerFastLogin() {
  currentUser = {
    uid: 'owner-minhquan',
    email: 'minhquan12092005@gmail.com',
    displayName: 'Minh Quân (Chủ Sở Hữu)',
    photoURL: ''
  };
  localStorage.setItem('smart_schedule_local_auth', JSON.stringify(currentUser));
  localStorage.removeItem('smart_schedule_guest_mode');
  updateAuthUI(currentUser);
  showToast('Đã đăng nhập thành công với quyền Chủ Sở Hữu!');
  if (typeof globalAuthCallback === 'function') {
    globalAuthCallback(currentUser);
  }
}

/**
 * Đăng nhập Google an toàn bằng Redirect (Tránh lỗi COOP / Popup Blocked)
 */
export async function handleGoogleRedirectLogin() {
  if (!auth) {
    handleOwnerFastLogin();
    return;
  }
  showToast('Đang chuyển hướng tới trang đăng nhập Google...');
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await auth.signInWithRedirect(provider);
  } catch (err) {
    console.error('[FirebaseAuth] Lỗi redirect Google:', err);
    showToast('Không thể chuyển hướng: ' + (err.message || 'Lỗi mạng'));
  }
}

/**
 * Thực hiện đăng nhập Google bằng Popup với tự động Fallback sang Redirect
 */
export async function handleGoogleLogin() {
  const landingBtn = document.getElementById('landing-login-btn');
  const authBtn = document.getElementById('auth-login-btn');
  const originalLandingHtml = landingBtn ? landingBtn.innerHTML : '';
  const originalAuthHtml = authBtn ? authBtn.innerHTML : '';

  // 1. Hiển thị trạng thái Loading trên nút
  if (landingBtn) {
    landingBtn.disabled = true;
    landingBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="font-size: 1.2rem; color: #4285f4;"></i> <span style="margin-left: 0.5rem;">Đang kết nối Google...</span>`;
  }
  if (authBtn) {
    authBtn.disabled = true;
    authBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang kết nối...</span>`;
  }

  showToast('Đang mở cửa sổ đăng nhập Google...');

  if (!auth) {
    // Fallback nếu không có mạng / SDK lỗi
    handleOwnerFastLogin();
    resetLoginButtons(landingBtn, authBtn, originalLandingHtml, originalAuthHtml);
    return;
  }

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await auth.signInWithPopup(provider);
  } catch (err) {
    console.error('[FirebaseAuth] Lỗi đăng nhập Google Popup:', err);

    // Nếu popup bị chặn hoặc gặp lỗi COOP Cross-Origin, tự động chuyển sang Redirect
    showToast('Đang chuyển hướng đăng nhập an toàn qua Google Redirect...');
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await auth.signInWithRedirect(provider);
    } catch (redirectErr) {
      console.error('[FirebaseAuth] Lỗi redirect fallback:', redirectErr);
      showToast('Popup bị chặn bởi trình duyệt. Đã chuyển sang chế độ Khách.');
      handleGuestLogin();
    }
  } finally {
    resetLoginButtons(landingBtn, authBtn, originalLandingHtml, originalAuthHtml);
  }
}

/**
 * Khôi phục trạng thái nút đăng nhập
 */
function resetLoginButtons(landingBtn, authBtn, originalLandingHtml, originalAuthHtml) {
  if (landingBtn) {
    landingBtn.disabled = false;
    landingBtn.innerHTML = originalLandingHtml;
  }
  if (authBtn) {
    authBtn.disabled = false;
    authBtn.innerHTML = originalAuthHtml;
  }
}

/**
 * Cho phép người dùng truy cập trực tiếp dưới tư cách Khách
 */
export function handleGuestLogin() {
  localStorage.setItem('smart_schedule_guest_mode', 'true');
  localStorage.removeItem('smart_schedule_local_auth');
  currentUser = null;
  updateAuthUI({ displayName: 'Khách (Offline)', isAnonymous: true });
  showToast('Đã vào ứng dụng với tư cách Khách! Dữ liệu lưu an toàn trên máy.');
  if (typeof globalAuthCallback === 'function') {
    globalAuthCallback(null);
  }
}

// Alias hỗ trợ tương thích ngược
export const loginWithGoogle = handleGoogleLogin;

/**
 * Thực hiện đăng xuất tài khoản
 */
export async function handleLogout() {
  localStorage.removeItem('smart_schedule_guest_mode');
  localStorage.removeItem('smart_schedule_local_auth');
  currentUser = null;
  if (auth) {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('[FirebaseAuth] Lỗi đăng xuất:', err);
    }
  }
  updateAuthUI(null);
  showToast('Đã đăng xuất tài khoản');
  if (typeof globalAuthCallback === 'function') {
    globalAuthCallback(null);
  }
}

/**
 * Cập nhật hiển thị giao diện theo trạng thái đăng nhập
 * @param {Object|null} user 
 */
export function updateAuthUI(user) {
  const loginScreen = document.getElementById('login-screen');
  const mainAppWrapper = document.getElementById('main-app-wrapper');
  const authLoginBtn = document.getElementById('auth-login-btn');
  const userProfileWidget = document.getElementById('user-profile-widget');
  const userAvatar = document.getElementById('user-avatar');
  const userDisplayName = document.getElementById('user-display-name');

  if (user) {
    // ĐÃ ĐĂNG NHẬP: Ẩn Login Screen & Mở Main App
    if (loginScreen) {
      loginScreen.style.display = 'none';
      loginScreen.classList.add('hidden');
    }
    if (mainAppWrapper) {
      mainAppWrapper.style.display = 'block';
      mainAppWrapper.classList.remove('hidden');
    }
    if (authLoginBtn) {
      authLoginBtn.style.display = 'none';
      authLoginBtn.classList.add('hidden');
    }
    if (userProfileWidget) {
      userProfileWidget.style.display = 'inline-flex';
      userProfileWidget.classList.remove('hidden');
      const nameText = user.displayName || user.email || 'Sinh viên';
      userProfileWidget.title = `Tài khoản: ${nameText}${user.email ? ` (${user.email})` : ''} • Nhấn nút đăng xuất để thoát`;
    }
    if (userAvatar) {
      if (user.photoURL) {
        userAvatar.src = user.photoURL;
      } else {
        const initial = (user.displayName || user.email || 'S').charAt(0).toUpperCase();
        userAvatar.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="%236366f1"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold" font-size="14">${initial}</text></svg>`;
      }
      userAvatar.style.display = 'inline-block';
      userAvatar.title = user.displayName || user.email || 'Sinh viên';
    }
    if (userDisplayName) {
      userDisplayName.textContent = user.displayName || 'Sinh viên';
    }
  } else {
    // CHƯA ĐĂNG NHẬP: Hiển thị Login Screen
    if (loginScreen) {
      loginScreen.style.display = 'flex';
      loginScreen.classList.remove('hidden');
    }
    if (mainAppWrapper) {
      mainAppWrapper.style.display = 'none';
      mainAppWrapper.classList.add('hidden');
    }
    if (authLoginBtn) {
      authLoginBtn.style.display = 'inline-flex';
      authLoginBtn.classList.remove('hidden');
    }
    if (userProfileWidget) {
      userProfileWidget.style.display = 'none';
      userProfileWidget.classList.add('hidden');
    }
  }
}

/**
 * Lắng nghe thay đổi dữ liệu thời gian thực từ Cloud Firestore theo User Scope
 * @param {string} uid 
 * @param {Function} onSyncCallback 
 */
function attachFirestoreListener(uid, onSyncCallback) {
  if (!db) return;

  const docRef = db.collection('users').doc(uid);
  firestoreUnsubscribe = docRef.onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (data) {
        if (Array.isArray(data.driveSubjects)) {
          state.driveSubjects = data.driveSubjects;
          persistDriveSubjects();
        }
        if (data.studentGrades && typeof data.studentGrades === 'object') {
          state.studentGrades = data.studentGrades;
          persistGrades();
        }
        if (Array.isArray(data.customWeeks)) {
          const customKey = isOwnerUser(currentUser) ? 'smart_schedule_custom_weeks' : `smart_schedule_${currentUser.uid}_custom_weeks`;
          localStorage.setItem(customKey, JSON.stringify(data.customWeeks));
        }
        if (data.customMds && typeof data.customMds === 'object') {
          Object.keys(data.customMds).forEach(k => {
            localStorage.setItem(k, data.customMds[k]);
          });
        }
        if (typeof onSyncCallback === 'function') onSyncCallback(currentUser);
      }
    } else {
      // Lưu dữ liệu khởi tạo lên Cloud lần đầu
      const initialDoc = {
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        driveSubjects: state.driveSubjects || [],
        studentGrades: state.studentGrades || {},
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      docRef.set(initialDoc, { merge: true });
    }
  }, (err) => {
    console.warn('[Firestore] Lỗi snapshot:', err);
  });
}

/**
 * Đồng bộ danh sách môn học và dữ liệu lên Cloud Firestore
 */
export function syncDriveSubjectsToCloud() {
  if (!db || !currentUser) return;
  const docRef = db.collection('users').doc(currentUser.uid);
  docRef.set({
    driveSubjects: state.driveSubjects || [],
    studentGrades: state.studentGrades || {},
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(err => {
    console.warn('[Firestore] Lỗi đồng bộ Cloud:', err);
  });
}

/**
 * Đồng bộ toàn bộ dữ liệu người dùng lên Cloud Firestore
 * @param {Array} customWeeks 
 * @param {Object} customMds 
 */
export function syncUserDataToCloud(customWeeks = [], customMds = {}) {
  if (!db || !currentUser) return;
  const docRef = db.collection('users').doc(currentUser.uid);
  docRef.set({
    driveSubjects: state.driveSubjects || [],
    studentGrades: state.studentGrades || {},
    customWeeks: customWeeks || [],
    customMds: customMds || {},
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(err => {
    console.warn('[Firestore] Lỗi đồng bộ toàn bộ dữ liệu:', err);
  });
}
