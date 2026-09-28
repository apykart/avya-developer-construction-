/* ============================================================
   CLOUDINARY CONFIG — used by admin.html and associate.html
   for uploading project images, gallery images, and profile photos.
   ------------------------------------------------------------
   1. Sign up free at https://cloudinary.com
   2. Dashboard → copy your "Cloud name" → paste below
   3. Settings (gear icon) → Upload → "Upload presets" → Add upload preset
      - Signing mode: UNSIGNED
      - Preset name: avya_unsigned  (or change the name below to match)
      - Save
   ============================================================ */
const CLOUDINARY_CLOUD_NAME = "PASTE_YOUR_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET = "avya_unsigned";

/**
 * Uploads a File object to Cloudinary and returns the secure HTTPS URL.
 * @param {File} file
 * @param {(percent:number)=>void} [onProgress]
 * @returns {Promise<string>} secure_url
 */
function uploadToCloudinary(file, onProgress) {
    return new Promise((resolve, reject) => {
        if (!file) { reject(new Error("No file selected")); return; }
        if (CLOUDINARY_CLOUD_NAME.startsWith("PASTE_")) {
            reject(new Error("Cloudinary not configured yet — set CLOUDINARY_CLOUD_NAME in cloudinary-config.js"));
            return;
        }
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.upload.onprogress = (e) => {
            if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
                    resolve(data.secure_url);
                } else {
                    reject(new Error(data.error?.message || "Cloudinary upload failed"));
                }
            } catch (err) { reject(err); }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
    });
}
