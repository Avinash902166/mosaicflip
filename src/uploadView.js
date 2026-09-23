import { publishPhotoToFirebase } from './firebaseService.js';

export function createUploadView(router) {
  const container = document.createElement('div');
  container.className = 'upload-screen-wrapper';

  container.innerHTML = `
    <div class="upload-screen-card">
      <div class="upload-header">
        <button class="top-bookmark-btn" id="btn-upload-home" title="Go Home">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <h2 class="upload-title">UPLOAD PHOTO TO MOSAIC</h2>
        <p class="upload-subtitle">Select or drop a photo to instantly beam to the Realtime Mosaic Wall</p>
      </div>

      <div class="upload-dropzone" id="dropzone">
        <input type="file" id="file-input" accept="image/*" style="display:none;" />
        <div class="dropzone-content" id="dropzone-content">
          <div class="upload-icon-circle">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <span class="dropzone-main-text">Tap to select photo or drag & drop</span>
          <span class="dropzone-sub-text">PNG, JPG, WEBP (Auto-cropped to 1:1 Square)</span>
        </div>
        <div class="upload-preview-wrap hidden" id="preview-wrap">
          <img id="preview-img" alt="Preview" />
          <button class="remove-preview-btn" id="btn-remove-preview" title="Choose another">✕</button>
        </div>
      </div>

      <div class="upload-status-text hidden" id="upload-status"></div>

      <div class="upload-actions">
        <button class="btn-action-ok" id="btn-submit-upload" disabled>
          <span class="btn-text">BEAM TO MOSAIC WALL</span>
        </button>
        <button class="quick-sim-btn" id="btn-view-wall" style="margin-top: 12px; width: 100%;">
          📺 View Mosaic Wall
        </button>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#dropzone');
  const fileInput = container.querySelector('#file-input');
  const dropzoneContent = container.querySelector('#dropzone-content');
  const previewWrap = container.querySelector('#preview-wrap');
  const previewImg = container.querySelector('#preview-img');
  const btnRemove = container.querySelector('#btn-remove-preview');
  const btnSubmit = container.querySelector('#btn-submit-upload');
  const statusEl = container.querySelector('#upload-status');
  const btnHome = container.querySelector('#btn-upload-home');
  const btnViewWall = container.querySelector('#btn-view-wall');

  let selectedDataUrl = null;

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.classList.remove('hidden');
    statusEl.style.color = isError ? '#ef4444' : '#38bdf8';
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Please select a valid image file', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      selectedDataUrl = e.target.result;
      previewImg.src = selectedDataUrl;
      dropzoneContent.classList.add('hidden');
      previewWrap.classList.remove('hidden');
      btnSubmit.removeAttribute('disabled');
      setStatus('');
    };
    reader.readAsDataURL(file);
  }

  dropzone.addEventListener('click', (e) => {
    if (e.target !== btnRemove && !selectedDataUrl) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  btnRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedDataUrl = null;
    previewImg.src = '';
    fileInput.value = '';
    previewWrap.classList.add('hidden');
    dropzoneContent.classList.remove('hidden');
    btnSubmit.setAttribute('disabled', 'true');
    setStatus('');
  });

  btnSubmit.addEventListener('click', async () => {
    if (!selectedDataUrl) return;

    btnSubmit.setAttribute('disabled', 'true');
    setStatus('⚡ Uploading to Cloudinary & Firebase Realtime Database...');

    try {
      const finalUrl = await publishPhotoToFirebase(selectedDataUrl);
      setStatus('✓ Successfully beamed to Mosaic Wall in real-time!');
      router.broadcast({
        type: 'PHOTO_APPROVED',
        image: finalUrl
      });

      setTimeout(() => {
        btnRemove.click();
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus('Upload failed: ' + (err.message || 'Unknown error'), true);
      btnSubmit.removeAttribute('disabled');
    }
  });

  if (btnHome) {
    btnHome.addEventListener('click', () => router.navigate('/start'));
  }
  if (btnViewWall) {
    btnViewWall.addEventListener('click', () => router.navigate('/horizontal'));
  }

  return container;
}
