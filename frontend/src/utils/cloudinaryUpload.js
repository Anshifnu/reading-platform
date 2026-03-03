const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "dmrp9xwrz";
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "BookSpHere";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

/**
 * Upload a file directly to Cloudinary from the browser.
 * @param {File} file - The file to upload
 * @param {function} [onProgress] - Optional progress callback (0-100)
 * @returns {Promise<string>} - The secure URL of the uploaded file
 */
export const uploadToCloudinary = (file, onProgress) => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", CLOUDINARY_URL);

        if (onProgress) {
            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });
        }

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.secure_url);
            } else {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.send(formData);
    });
};

/**
 * Upload multiple files to Cloudinary.
 * @param {File[]} files
 * @param {function} [onProgress] - Progress callback receives { current, total, percent }
 * @returns {Promise<string[]>} - Array of secure URLs
 */
export const uploadMultipleToCloudinary = async (files, onProgress) => {
    const urls = [];
    for (let i = 0; i < files.length; i++) {
        const url = await uploadToCloudinary(files[i], (percent) => {
            if (onProgress) {
                onProgress({ current: i + 1, total: files.length, percent });
            }
        });
        urls.push(url);
    }
    return urls;
};

export default uploadToCloudinary;
