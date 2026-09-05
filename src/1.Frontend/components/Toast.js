/**
 * ==========================================================================
 * FRONTEND COMPONENT - TOAST NOTIFICATION
 * Hiển thị thông báo nhanh không chặn người dùng
 * ==========================================================================
 */

import { escapeHtml } from '../../4.Security/sanitizer.js';

let toastContainer = null;

export function initToastContainer() {
  toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

/**
 * Hiển thị thông báo Toast
 * @param {string} message 
 * @param {number} duration - Thời gian hiển thị (ms)
 */
export function showToast(message, duration = 3000) {
  if (!toastContainer) initToastContainer();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${escapeHtml(message)}`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, duration);
}
