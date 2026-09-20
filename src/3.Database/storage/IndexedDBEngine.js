/**
 * ==========================================================================
 * DATABASE STORAGE ENGINE - INDEXEDDB STORAGE (ATTACHMENTS & PDFS)
 * Quản lý lưu trữ tệp nhị phân Blob dung lượng lớn (PDF, tài liệu) cục bộ
 * Đảm bảo 100% Offline, Zero-Cost Server và triệt tiêu lỗi tràn LocalStorage.
 * ==========================================================================
 */

// 1. CONSTANTS & CONFIG
const DB_NAME = 'SmartSchedule_Storage';
const DB_VERSION = 1;
const STORE_PDFS = 'pdf_attachments';

let dbInstance = null;

// 2. INITIALIZATION & CONNECTION
/**
 * Khởi tạo và kết nối cơ sở dữ liệu IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
export function getDbConnection() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Trình duyệt của bạn không hỗ trợ IndexedDB!'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PDFS)) {
        const store = db.createObjectStore(STORE_PDFS, { keyPath: 'id' });
        store.createIndex('by_subject', 'subjectCode', { unique: false });
        store.createIndex('by_node', 'nodeId', { unique: false });
        store.createIndex('by_created', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Lỗi khởi tạo IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

// 3. CRUD OPERATIONS CHO FILE PDF

/**
 * Định dạng dung lượng byte thành chuỗi người đọc (KB, MB)
 * @param {number} bytes 
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Lưu trữ file PDF (File hoặc Blob) vào IndexedDB
 * @param {File|Blob} fileOrBlob - Tệp PDF người dùng tải lên
 * @param {Object} metadata - Thông tin môn học, node và tên file
 * @returns {Promise<{ id: string, name: string, size: string, sizeBytes: number, createdAt: number }>}
 */
export async function savePdfAttachment(fileOrBlob, metadata = {}) {
  const db = await getDbConnection();
  const id = metadata.id || `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const fileName = metadata.name || fileOrBlob.name || 'TaiLieu.pdf';
  const sizeBytes = fileOrBlob.size || 0;
  const sizeFormatted = formatFileSize(sizeBytes);
  const createdAt = metadata.createdAt || Date.now();

  const record = {
    id,
    name: fileName,
    blob: fileOrBlob,
    type: fileOrBlob.type || 'application/pdf',
    sizeBytes,
    sizeFormatted,
    subjectCode: metadata.subjectCode || '',
    nodeId: metadata.nodeId || '',
    pageCount: metadata.pageCount || 0,
    createdAt
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PDFS], 'readwrite');
    const store = tx.objectStore(STORE_PDFS);
    const request = store.put(record);

    request.onsuccess = () => {
      resolve({
        id,
        name: fileName,
        size: sizeFormatted,
        sizeBytes,
        pageCount: record.pageCount,
        createdAt
      });
    };

    request.onerror = (e) => {
      console.error('Lỗi khi lưu PDF vào IndexedDB:', e.target.error);
      reject(e.target.error);
    };
  });
}

/**
 * Lấy toàn bộ bản ghi PDF bao gồm cả Blob từ IndexedDB theo ID
 * @param {string} id - ID của file PDF
 * @returns {Promise<{ id: string, name: string, blob: Blob, type: string, sizeFormatted: string } | null>}
 */
export async function getPdfAttachment(id) {
  if (!id) return null;
  const db = await getDbConnection();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PDFS], 'readonly');
    const store = tx.objectStore(STORE_PDFS);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (e) => {
      console.error(`Lỗi khi đọc PDF ID ${id}:`, e.target.error);
      reject(e.target.error);
    };
  });
}

/**
 * Cấp phát Object URL tạm thời từ Blob PDF trong IndexedDB
 * @param {string} id - ID file PDF
 * @returns {Promise<{ url: string, name: string, record: Object } | null>}
 */
export async function createPdfBlobUrl(id) {
  const item = await getPdfAttachment(id);
  if (!item || !item.blob) return null;
  const url = URL.createObjectURL(item.blob);
  return {
    url,
    name: item.name,
    record: item
  };
}

/**
 * Hủy thu hồi Object URL để giải phóng RAM
 * @param {string} url 
 */
export function revokePdfBlobUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Xóa một file PDF khỏi IndexedDB
 * @param {string} id - ID file cần xóa
 * @returns {Promise<boolean>}
 */
export async function deletePdfAttachment(id) {
  if (!id) return false;
  const db = await getDbConnection();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PDFS], 'readwrite');
    const store = tx.objectStore(STORE_PDFS);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (e) => {
      console.error(`Lỗi khi xóa PDF ID ${id}:`, e.target.error);
      reject(e.target.error);
    };
  });
}
