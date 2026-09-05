/**
 * ==========================================================================
 * DATABASE & AUTH SERVICE - FIREBASE AUTH & CLOUD FIRESTORE SYNC
 * Quản lý đăng nhập Google OAuth & đồng bộ dữ liệu đa thiết bị qua Cloud
 * ==========================================================================
 */

import { state, persistDriveSubjects } from '../state.js';
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

let firebaseApp = null;
let auth = null;
let db = null;
let currentUser = null;
let firestoreUnsubscribe = null;

/**
 * Khởi tạo Firebase Authentication & Firestore Listener
 * @param {Function} onAuthChangedCallback - Callback khi trạng thái đăng nhập thay đổi
 */
export function initFirebaseAuth(onAuthChangedCallback) {
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

  // Gắn sự kiện click các nút đăng nhập / khách / đăng xuất
  const landingLoginBtn = document.getElementById('landing-login-btn');
  const landingGuestBtn = document.getElementById('landing-guest-btn');
  const authLoginBtn = document.getElementById('auth-login-btn');
  const authLogoutBtn = document.getElementById('auth-logout-btn');

  if (landingLoginBtn) landingLoginBtn.onclick = handleGoogleLogin;
  if (landingGuestBtn) landingGuestBtn.onclick = handleGuestLogin;
  if (authLoginBtn) authLoginBtn.onclick = handleGoogleLogin;
  if (authLogoutBtn) authLogoutBtn.onclick = handleLogout;

  if (auth) {
    // 1. Kiểm tra kết quả Redirect nếu trình duyệt vừa quay lại từ Google Login
    auth.getRedirectResult().then((result) => {
      if (result && result.user) {
        currentUser = result.user;
        localStorage.removeItem('smart_schedule_guest_mode');
        updateAuthUI(result.user);
        showToast(`Đăng nhập thành công! Xin chào ${result.user.displayName || 'bạn'}.`);
      }
    }).catch((err) => {
      console.warn('[FirebaseAuth] getRedirectResult error:', err);
    });

    // 2. Lắng nghe trạng thái đăng nhập
    auth.onAuthStateChanged((user) => {
      currentUser = user;

      if (user) {
        localStorage.removeItem('smart_schedule_guest_mode');
        updateAuthUI(user);
        attachFirestoreListener(user.uid, onAuthChangedCallback);
        showToast(`Xin chào, ${user.displayName || 'bạn'}! Đã kết nối Cloud.`);
      } else {
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
          firestoreUnsubscribe = null;
        }

        // Nếu đã từng chọn chế độ khách trước đó, tự động mở app
        const isGuest = localStorage.getItem('smart_schedule_guest_mode') === 'true';
        if (isGuest) {
          updateAuthUI({ displayName: 'Khách (Offline)', isAnonymous: true });
        } else {
          updateAuthUI(null);
        }
      }

      if (typeof onAuthChangedCallback === 'function') {
        onAuthChangedCallback(user);
      }
    });
  } else {
    // Không có kết nối Firebase SDK -> Chạy chế độ Offline LocalStorage
    console.log('[FirebaseAuth] Chạy chế độ Offline LocalStorage');
    updateAuthUI({ displayName: 'Khách', isAnonymous: true });
    if (typeof onAuthChangedCallback === 'function') {
      onAuthChangedCallback(null);
    }
  }
}

/**
 * Thực hiện đăng nhập Google bằng Popup / Redirect với xử lý lỗi toàn diện
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
    handleGuestLogin();
    showToast('Firebase chưa sẵn sàng. Đã chuyển sang chế độ Khách Offline.');
    resetLoginButtons(landingBtn, authBtn, originalLandingHtml, originalAuthHtml);
    return;
  }

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await auth.signInWithPopup(provider);
  } catch (err) {
    console.error('[FirebaseAuth] Lỗi đăng nhập Google:', err);
    
    if (err.code === 'auth/unauthorized-domain') {
      showToast('⚠️ Domain GitHub Pages chưa thêm vào Firebase Console! Đang tự động mở app ở chế độ Khách...');
      handleGuestLogin();
    } else if (err.code === 'auth/popup-blocked') {
      showToast('Cửa sổ Popup bị chặn! Đang thử chuyển hướng đăng nhập...');
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithRedirect(provider);
      } catch (redirectErr) {
        console.error('[FirebaseAuth] Lỗi redirect:', redirectErr);
        handleGuestLogin();
      }
    } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      showToast('Bạn đã đóng cửa sổ đăng nhập Google.');
    } else {
      showToast('Lỗi đăng nhập: ' + (err.message || 'Vui lòng kiểm tra lại kết nối mạng.'));
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
  updateAuthUI({ displayName: 'Khách (Offline)', isAnonymous: true });
  showToast('Đã vào ứng dụng với tư cách Khách! Dữ liệu lưu an toàn trên máy.');
}

// Alias hỗ trợ tương thích ngược
export const loginWithGoogle = handleGoogleLogin;

/**
 * Thực hiện đăng xuất tài khoản
 */
export async function handleLogout() {
  localStorage.removeItem('smart_schedule_guest_mode');
  if (!auth) {
    updateAuthUI(null);
    return;
  }
  try {
    await auth.signOut();
    updateAuthUI(null);
    showToast('Đã đăng xuất tài khoản');
  } catch (err) {
    console.error('[FirebaseAuth] Lỗi đăng xuất:', err);
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
    }
    if (userAvatar && user.photoURL) {
      userAvatar.src = user.photoURL;
      userAvatar.style.display = 'inline-block';
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
 * Lắng nghe thay đổi dữ liệu thời gian thực từ Cloud Firestore
 * @param {string} uid 
 * @param {Function} onSyncCallback 
 */
function attachFirestoreListener(uid, onSyncCallback) {
  if (!db) return;

  const docRef = db.collection('users').doc(uid);
  firestoreUnsubscribe = docRef.onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (data && data.driveSubjects && Array.isArray(data.driveSubjects) && data.driveSubjects.length > 0) {
        state.driveSubjects = data.driveSubjects;
        persistDriveSubjects();
        if (typeof onSyncCallback === 'function') onSyncCallback(currentUser);
      }
    } else {
      // Lưu dữ liệu khởi tạo lên Cloud lần đầu
      docRef.set({
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        driveSubjects: state.driveSubjects,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }, (err) => {
    console.warn('[Firestore] Lỗi snapshot:', err);
  });
}

/**
 * Đồng bộ danh sách môn học lên Cloud Firestore
 */
export function syncDriveSubjectsToCloud() {
  if (!db || !currentUser) return;
  const docRef = db.collection('users').doc(currentUser.uid);
  docRef.set({
    driveSubjects: state.driveSubjects,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(err => {
    console.warn('[Firestore] Lỗi đồng bộ Cloud:', err);
  });
}
