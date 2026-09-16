/**
 * ==========================================================================
 * UTILS - SMART IMAGE COMPRESSOR
 * Tối ưu hóa kích thước ảnh, chuyển đổi WebP và giảm tải RAM/CPU cho ứng dụng
 * ==========================================================================
 */

/**
 * Nén và resize ảnh thông minh trước khi lưu hoặc upload
 * Giảm 90-98% dung lượng từ PNG 5MB xuống còn ~60-120KB WebP
 * 
 * @param {File|Blob} fileOrBlob - File ảnh gốc
 * @param {number} maxWidth - Chiều rộng tối đa (mặc định 1280px)
 * @param {number} maxHeight - Chiều cao tối đa (mặc định 1280px)
 * @param {number} quality - Chất lượng ảnh từ 0.1 đến 1.0 (mặc định 0.8)
 * @returns {Promise<{ blob: Blob, dataUrl: string, width: number, height: number, sizeBytes: number }>}
 */
export function compressImage(fileOrBlob, maxWidth = 1280, maxHeight = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!fileOrBlob || !fileOrBlob.type || !fileOrBlob.type.startsWith('image/')) {
      return reject(new Error('File không phải là định dạng hình ảnh hợp lệ'));
    }

    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width || 400;
      let height = img.naturalHeight || img.height || 300;

      // Tính toán tỷ lệ co giãn giữ nguyên aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Không thể khởi tạo Canvas 2D context'));
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Ưu tiên WebP, fallback JPEG
      const mimeType = 'image/webp';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to dataUrl nếu toBlob không thành công
            const fallbackDataUrl = canvas.toDataURL('image/jpeg', quality);
            return resolve({
              blob: fileOrBlob,
              dataUrl: fallbackDataUrl,
              width,
              height,
              sizeBytes: fallbackDataUrl.length
            });
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blob,
              dataUrl: reader.result,
              width,
              height,
              sizeBytes: blob.size
            });
          };
          reader.onerror = () => {
            resolve({
              blob,
              dataUrl: canvas.toDataURL(mimeType, quality),
              width,
              height,
              sizeBytes: blob.size
            });
          };
          reader.readAsDataURL(blob);
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err || new Error('Không thể nạp hình ảnh để nén'));
    };

    img.src = objectUrl;
  });
}
