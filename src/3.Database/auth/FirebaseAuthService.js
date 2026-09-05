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

  if (auth) {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      updateAuthUI(user);

      if (user) {
        attachFirestoreListener(user.uid, onAuthChangedCallback);
        showToast(`Xin chào, ${user.displayName || 'bạn'}! Đã kết nối Cloud.`);
      } else {
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
          firestoreUnsubscribe = null;
        }
      }

      if (typeof onAuthChangedCallback === 'function') {
        onAuthChangedCallback(user);
      }
    });
  } else {
    // Nếu không có Firebase SDK (offline/cục bộ), mở thẳng app cho người dùng
    console.log('[FirebaseAuth] Chạy chế độ Offline LocalStorage');
    updateAuthUI({ displayName: 'Khách', isAnonymous: true });
    if (typeof onAuthChangedCallback === 'function') {
      onAuthChangedCallback(null);
    }
  }

  // Gắn sự kiện click nút đăng nhập
  const landingLoginBtn = document.getElementById('landing-login-btn');
  const authLoginBtn = document.getElementById('auth-login-btn');
  const authLogoutBtn = document.getElementById('auth-logout-btn');

  if (landingLoginBtn) {
    landingLoginBtn.onclick = handleGoogleLogin;
  }
  if (authLoginBtn) {
    authLoginBtn.onclick = handleGoogleLogin;
  }
  if (authLogoutBtn) {
    authLogoutBtn.onclick = handleLogout;
  }
}

/**
 * Thực hiện đăng nhập Google bằng Popup
 */
export async function handleGoogleLogin() {
  if (!auth) {
    // Fallback nếu không có mạng / SDK lỗi
    updateAuthUI({ displayName: 'Sinh viên' });
    showToast('Đang chạy ở chế độ cục bộ Offline');
    return;
  }

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (err) {
    console.error('[FirebaseAuth] Lỗi đăng nhập Google:', err);
    showToast('Lỗi đăng nhập: ' + (err.message || 'Vui lòng kiểm tra lại'));
  }
}

/**
 * Thực hiện đăng xuất tài khoản
 */
export async function handleLogout() {
  if (!auth) {
    updateAuthUI(null);
    return;
  }
  try {
    await auth.signOut();
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
