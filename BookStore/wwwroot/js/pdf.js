/**
 * PDF Viewer Component for Mobile and Desktop Browsers
 * Usage:
 * 1. Include this script in your HTML
 * 2. Create a container element: <div id="pdf-container"></div>
 * 3. Initialize: new PDFViewer({ container: '#pdf-container', url: 'your.pdf' });
 */

class PDFViewer {
    constructor(options) {
        // Default options
        const defaults = {
            container: '#pdf-container',
            url: '',
            scale: 1.5,
            showToolbar: true,
            showPageInfo: true,
            enableZoom: true
        };

        // Merge options with defaults
        this.options = { ...defaults, ...options };

        // Initialize variables
        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = this.options.scale;
        this.initialDistance = null;

        // Validate container
        this.container = typeof this.options.container === 'string'
            ? document.querySelector(this.options.container)
            : this.options.container;

        if (!this.container) {
            console.error('PDFViewer: Container element not found');
            return;
        }

        // Initialize the viewer
        this.init();
    }

    init() {
        // Create viewer structure
        this.container.innerHTML = `
      <div class="pdf-viewer-wrapper">
        <div class="pdf-canvas-container">
          <canvas class="pdf-canvas"></canvas>
        </div>
        ${this.options.showToolbar ? `
        <div class="pdf-toolbar">
          ${this.options.showPageInfo ? `
          <div class="page-info">
            Page <span class="current-page">1</span> of <span class="total-pages">0</span>
          </div>
          ` : ''}
          <button class="prev-page">Previous</button>
          <button class="next-page">Next</button>
        </div>
        ` : ''}
        <div class="pdf-loading">Loading PDF...</div>
      </div>
    `;

        // Get DOM elements
        this.canvas = this.container.querySelector('.pdf-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.loading = this.container.querySelector('.pdf-loading');
        this.prevBtn = this.container.querySelector('.prev-page');
        this.nextBtn = this.container.querySelector('.next-page');
        this.currentPageEl = this.container.querySelector('.current-page');
        this.totalPagesEl = this.container.querySelector('.total-pages');

        // Add basic styles
        this.addStyles();

        // Load the PDF
        this.loadPDF();

        // Add event listeners
        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevPage());
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextPage());

        if (this.options.enableZoom) {
            this.setupZoom();
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.pdfDoc) {
                this.renderPage(this.pageNum);
            }
        });
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
      .pdf-viewer-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .pdf-canvas-container {
        width: 100%;
        height: calc(100% - 50px);
        overflow: auto;
        -webkit-overflow-scrolling: touch;
      }
      .pdf-canvas {
        width: 100%;
        display: block;
      }
      .pdf-toolbar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: #333;
        color: white;
        padding: 10px;
        display: flex;
        justify-content: space-around;
        align-items: center;
      }
      .pdf-toolbar button {
        background: #555;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        font-size: 14px;
      }
      .page-info {
        margin: 0 15px;
        font-size: 14px;
      }
      .pdf-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 20px;
        border-radius: 5px;
        display: none;
      }
    `;
        document.head.appendChild(style);
    }

    loadPDF() {
        if (!this.options.url) {
            console.error('PDFViewer: No PDF URL provided');
            return;
        }

        this.loading.style.display = 'block';

        // Load PDF.js if not already loaded
        if (typeof pdfjsLib === 'undefined') {
            this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js', () => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
                this.loadPDFDocument();
            });
        } else {
            this.loadPDFDocument();
        }
    }

    loadPDFDocument() {
        pdfjsLib.getDocument(this.options.url).promise
            .then(pdfDoc => {
                this.pdfDoc = pdfDoc;
                if (this.totalPagesEl) {
                    this.totalPagesEl.textContent = pdfDoc.numPages;
                }
                this.renderPage(this.pageNum);
                this.loading.style.display = 'none';
            })
            .catch(error => {
                this.loading.textContent = 'Error loading PDF: ' + error.message;
                console.error('PDFViewer:', error);
            });
    }

    renderPage(num) {
        this.pageRendering = true;

        this.pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale: this.scale });
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;

            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                this.pageRendering = false;
                if (this.pageNumPending !== null) {
                    this.renderPage(this.pageNumPending);
                    this.pageNumPending = null;
                }
            });
        });

        if (this.currentPageEl) {
            this.currentPageEl.textContent = num;
        }
        this.pageNum = num;
    }

    queueRenderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
        } else {
            this.renderPage(num);
        }
    }

    prevPage() {
        if (this.pageNum <= 1) return;
        this.pageNum--;
        this.queueRenderPage(this.pageNum);
    }

    nextPage() {
        if (this.pageNum >= this.pdfDoc.numPages) return;
        this.pageNum++;
        this.queueRenderPage(this.pageNum);
    }

    setupZoom() {
        this.canvas.addEventListener('touchstart', e => {
            if (e.touches.length === 2) {
                e.preventDefault();
                this.initialDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        });

        this.canvas.addEventListener('touchmove', e => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );

                if (this.initialDistance) {
                    const newScale = this.scale * (currentDistance / this.initialDistance);
                    this.scale = Math.min(Math.max(newScale, 0.5), 3);
                    this.renderPage(this.pageNum);
                }

                this.initialDistance = currentDistance;
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.initialDistance = null;
        });
    }

    loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    }
}

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-pdf-viewer]').forEach(container => {
        const url = container.getAttribute('data-pdf-url');
        const options = {
            container: container,
            url: url,
            scale: parseFloat(container.getAttribute('data-pdf-scale')) || 1.5,
            showToolbar: container.getAttribute('data-pdf-toolbar') !== 'false',
            showPageInfo: container.getAttribute('data-pdf-page-info') !== 'false',
            enableZoom: container.getAttribute('data-pdf-zoom') !== 'false'
        };
        new PDFViewer(options);
    });
});