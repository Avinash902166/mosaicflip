import { initializeApp } from "firebase/app";
import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  onChildAdded, 
  onValue, 
  remove, 
  serverTimestamp, 
  query, 
  orderByChild 
} from "firebase/database";

// Web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyB_39zYXv15uGbAUmU4aC7ZCnhjlnkfqCE",
  authDomain: "mosaicwall-a7b39.firebaseapp.com",
  databaseURL: "https://mosaicwall-a7b39-default-rtdb.firebaseio.com",
  projectId: "mosaicwall-a7b39",
  storageBucket: "mosaicwall-a7b39.firebasestorage.app",
  messagingSenderId: "914258649279",
  appId: "1:914258649279:web:6230a8a35e2e889590a60a"
};

// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: "dzz5belph",
  apiKey: "528467798978286",
  apiSecret: "JECGZNA3M-BzraYbs2mQPHy9RN8",
  folder: "pepsicomosaic",
  uploadPreset: "mosaic"
};

// Initialize Firebase App and Database
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Reference path in RTDB
export const PHOTOS_REF_PATH = "mosaic_photos";

/**
 * Upload image (Base64 data URL or Blob/File) to Cloudinary
 * @param {string | Blob} fileData 
 * @returns {Promise<string>} Secure image URL
 */
export async function uploadToCloudinary(fileData) {
  try {
    const formData = new FormData();
    formData.append("file", fileData);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    if (CLOUDINARY_CONFIG.folder) {
      formData.append("folder", CLOUDINARY_CONFIG.folder);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Cloudinary upload failed, falling back to direct data:", errText);
      // If Cloudinary preset requires signing or errors, return raw data so app doesn't break
      return typeof fileData === 'string' ? fileData : URL.createObjectURL(fileData);
    }

    const result = await response.json();
    return result.secure_url || result.url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    // Return original data as fallback
    return typeof fileData === 'string' ? fileData : URL.createObjectURL(fileData);
  }
}

/**
 * Save and broadcast a new photo into Firebase Realtime Database
 * @param {string} photoData - Base64 string or image URL
 * @returns {Promise<string>} Saved photo URL
 */
export async function publishPhotoToFirebase(photoData) {
  let finalUrl = photoData;

  // If base64 data, upload to Cloudinary first
  if (typeof photoData === 'string' && photoData.startsWith('data:image')) {
    try {
      finalUrl = await uploadToCloudinary(photoData);
    } catch (e) {
      console.warn("Failed uploading to Cloudinary, saving local string directly to RTDB:", e);
    }
  }

  const photosRef = ref(db, PHOTOS_REF_PATH);
  const newPhotoRef = push(photosRef);

  await set(newPhotoRef, {
    url: finalUrl,
    createdAt: Date.now(),
    source: "kiosk"
  });

  return finalUrl;
}

/**
 * Real-time listener for Firebase Realtime Database (Zero Polling, purely event-driven via WebSockets)
 * @param {Function} onNewPhotoCallback - Called whenever a live new photo is pushed
 * @param {Function} onInitialLoadCallback - Called with array of existing photos on first connect
 * @returns {Function} Unsubscribe function
 */
export function subscribeToFirebasePhotos(onNewPhotoCallback, onInitialLoadCallback) {
  const photosRef = ref(db, PHOTOS_REF_PATH);
  let isInitialLoadDone = false;
  const initialPhotos = [];
  const seenKeys = new Set();

  // 1. Initial snapshot load
  onValue(photosRef, (snapshot) => {
    if (!isInitialLoadDone) {
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([key, val]) => {
          seenKeys.add(key);
          if (val && (val.url || typeof val === 'string')) {
            initialPhotos.push(val.url || val);
          }
        });
      }
      isInitialLoadDone = true;
      if (onInitialLoadCallback) {
        onInitialLoadCallback(initialPhotos);
      }
    }
  }, { onlyOnce: true });

  // 2. Real-time child listener (Push events without polling)
  const unsubscribe = onChildAdded(photosRef, (snapshot) => {
    const key = snapshot.key;
    const val = snapshot.val();
    const photoUrl = val ? (val.url || val) : null;

    if (!photoUrl) return;

    if (!isInitialLoadDone) {
      // Still during initial load sequence
      seenKeys.add(key);
    } else {
      // Brand new real-time photo added!
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        if (onNewPhotoCallback) {
          onNewPhotoCallback(photoUrl);
        }
      }
    }
  });

  return () => {
    // Unsubscribe
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
}

/**
 * Reset / Clear all photos in Firebase Realtime Database
 */
export async function clearFirebasePhotos() {
  const photosRef = ref(db, PHOTOS_REF_PATH);
  await remove(photosRef);
}
