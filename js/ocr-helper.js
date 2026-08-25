/* ============================================================
   OCR Helper — Screenshot to Text
   Uses Tesseract.js for browser-based OCR
   Game Numerasi Ranking 1
   ============================================================ */

const OCRHelper = {
  currentImageBlob: null,
  isProcessing: false,

  // --- Handle file upload ---
  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar!', 'error');
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 10MB!', 'error');
      return;
    }

    this.currentImageBlob = file;
    this.showPreview(file);

    // Reset file input so the same file can be re-selected
    event.target.value = '';
  },

  // --- Paste from clipboard ---
  async pasteFromClipboard() {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        showToast('Browser tidak mendukung clipboard. Gunakan Ctrl+V atau upload gambar.', 'error');
        return;
      }

      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        // Look for image types
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          this.currentImageBlob = blob;
          this.showPreview(blob);
          return;
        }
      }

      showToast('Tidak ada gambar di clipboard. Screenshot dulu lalu tempel di sini.', 'info');
    } catch (err) {
      console.error('Clipboard read error:', err);
      if (err.name === 'NotAllowedError') {
        showToast('Izinkan akses clipboard di browser Anda.', 'error');
      } else {
        showToast('Gagal membaca clipboard. Coba upload gambar sebagai gantinya.', 'error');
      }
    }
  },

  // --- Show image preview ---
  showPreview(imageSource) {
    const preview = document.getElementById('ocr-preview');
    const img = document.getElementById('ocr-preview-img');
    const status = document.getElementById('ocr-status');
    const extractBtn = document.getElementById('btn-ocr-extract');

    if (!preview || !img) return;

    // Create object URL for the image
    const url = imageSource instanceof Blob
      ? URL.createObjectURL(imageSource)
      : imageSource;

    img.onload = () => {
      preview.style.display = 'block';
      status.style.display = 'none';
      extractBtn.style.display = 'flex';
      extractBtn.disabled = false;

      // Smooth scroll to preview
      preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    img.src = url;
  },

  // --- Clear the preview ---
  clearPreview() {
    const preview = document.getElementById('ocr-preview');
    const img = document.getElementById('ocr-preview-img');
    const status = document.getElementById('ocr-status');
    const extractBtn = document.getElementById('btn-ocr-extract');

    if (img && img.src) {
      URL.revokeObjectURL(img.src);
      img.src = '';
    }

    if (preview) preview.style.display = 'none';
    if (status) status.style.display = 'none';
    if (extractBtn) {
      extractBtn.style.display = 'flex';
      extractBtn.disabled = false;
    }

    this.currentImageBlob = null;
  },

  // --- Extract text from image ---
  async extractText() {
    if (!this.currentImageBlob) {
      showToast('Tidak ada gambar untuk diekstrak!', 'error');
      return;
    }

    if (this.isProcessing) return;
    this.isProcessing = true;

    const status = document.getElementById('ocr-status');
    const statusText = document.getElementById('ocr-status-text');
    const progressFill = document.getElementById('ocr-progress-fill');
    const extractBtn = document.getElementById('btn-ocr-extract');

    // Show processing state
    status.style.display = 'flex';
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span class="spinner spinner-sm"></span> Memproses...';
    this.updateProgress(0, 'Menyiapkan OCR engine...');

    try {
      const result = await Tesseract.recognize(
        this.currentImageBlob,
        'ind+eng', // Indonesian + English
        {
          logger: (info) => {
            if (info.status === 'recognizing text') {
              const pct = Math.round((info.progress || 0) * 100);
              this.updateProgress(pct, `Mengenali teks... ${pct}%`);
            } else if (info.status === 'loading language traineddata') {
              this.updateProgress(10, 'Memuat model bahasa...');
            } else if (info.status === 'initializing api') {
              this.updateProgress(5, 'Inisialisasi OCR...');
            } else if (info.status === 'loaded language traineddata') {
              this.updateProgress(20, 'Model bahasa dimuat...');
            }
          }
        }
      );

      const extractedText = result.data.text.trim();

      if (extractedText) {
        // Fill the textarea
        const textarea = document.getElementById('q-text');
        if (textarea) {
          // If there's existing text, append; otherwise replace
          if (textarea.value.trim()) {
            textarea.value = textarea.value.trim() + '\n' + extractedText;
          } else {
            textarea.value = extractedText;
          }
          // Trigger input event for any listeners
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }

        this.updateProgress(100, 'Selesai! ✅');
        showToast(`Teks berhasil diekstrak! (${extractedText.length} karakter)`, 'success');
      } else {
        this.updateProgress(100, 'Tidak ada teks terdeteksi ⚠️');
        showToast('Tidak ada teks terdeteksi di gambar. Coba gambar lain dengan teks yang lebih jelas.', 'info');
      }
    } catch (err) {
      console.error('OCR error:', err);
      this.updateProgress(0, 'Error! ❌');
      showToast('Gagal mengekstrak teks: ' + err.message, 'error');
    } finally {
      this.isProcessing = false;
      extractBtn.disabled = false;
      extractBtn.innerHTML = '🔍 Ekstrak Teks dari Gambar';
    }
  },

  // --- Update progress bar ---
  updateProgress(percent, text) {
    const progressFill = document.getElementById('ocr-progress-fill');
    const statusText = document.getElementById('ocr-status-text');

    if (progressFill) {
      progressFill.style.width = percent + '%';
    }
    if (statusText) {
      statusText.textContent = text;
    }
  },

  // --- Initialize paste listener on the question modal ---
  init() {
    // Listen for paste events on the document when modal is open
    document.addEventListener('paste', (event) => {
      const modal = document.getElementById('question-modal');
      if (!modal || !modal.classList.contains('active')) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            this.currentImageBlob = blob;
            this.showPreview(blob);
            showToast('Screenshot ditempel! Klik "Ekstrak Teks" untuk memproses.', 'info');
          }
          return;
        }
      }
    });

    // Also support drag & drop on the textarea area
    const textareaGroup = document.querySelector('#q-text')?.closest('.input-group');
    if (textareaGroup) {
      textareaGroup.addEventListener('dragover', (e) => {
        e.preventDefault();
        textareaGroup.classList.add('ocr-drag-over');
      });

      textareaGroup.addEventListener('dragleave', () => {
        textareaGroup.classList.remove('ocr-drag-over');
      });

      textareaGroup.addEventListener('drop', (e) => {
        e.preventDefault();
        textareaGroup.classList.remove('ocr-drag-over');

        const file = e.dataTransfer?.files[0];
        if (file && file.type.startsWith('image/')) {
          this.currentImageBlob = file;
          this.showPreview(file);
          showToast('Gambar ditambahkan! Klik "Ekstrak Teks" untuk memproses.', 'info');
        }
      });
    }
  }
};

// Initialize OCR helper when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  OCRHelper.init();
});
