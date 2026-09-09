import { appParams } from "@/lib/app-params";

/**
 * Uploads a file to the Base44 Core.UploadFile endpoint with real progress tracking.
 * Uses XMLHttpRequest instead of the SDK's axios call so we get upload.onprogress events.
 *
 * @param {File} file - The file to upload
 * @param {(progress: number) => void} onProgress - Callback with 0-100 percentage
 * @returns {Promise<{file_url: string}>} - The uploaded file URL
 */
export function uploadFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${appParams.serverUrl}/api/apps/${appParams.appId}/integration-endpoints/Core/UploadFile`;

    const formData = new FormData();
    formData.append("file", file, file.name);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (err) {
          reject(new Error("Failed to parse upload response"));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    xhr.open("POST", url);
    if (appParams.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${appParams.token}`);
    }
    xhr.setRequestHeader("X-Origin-URL", window.location.href);
    xhr.timeout = 120000; // 2 minutes for slow rural connections
    xhr.send(formData);
  });
}