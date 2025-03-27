
document.addEventListener("DOMContentLoaded", function () {
                const cookieConsent = document.getElementById("cookieConsent");
                const acceptBtn = document.getElementById("acceptCookies");

                // Show banner if no consent yet
                if (!getCookie("cookieConsent")) {
                    cookieConsent.style.display = "block";
                }

                acceptBtn.addEventListener("click", function () {
                    testCookieSupport(); // Only checks if cookies work
                    cookieConsent.style.display = "none";
                });
                var lgn = document.getElementById("lgn");
                var jwtToken = document.cookie.split('; ').find(row => row.startsWith('jwtToken='));

                if (lgn) {
                    if (jwtToken) {
                        lgn.textContent = "Logout";
                        lgn.href = "#";
                    }

                    lgn.addEventListener("click", function (event) {
                        if (lgn.textContent === "Logout") {
                            event.preventDefault();
                            // Delete the cookie by setting its expiration to a past date
                            document.cookie = "jwtToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            // Redirect to login page
                            window.location.href = "/";
                        }
                    });
                }
            });
function testCookieSupport() {
    // 1. Try saving a TEST cookie
    document.cookie = "cookieTest=1; Path=/; SameSite=Lax;"; // 5 sec expiry

    // 2. Verify after a short delay
    setTimeout(() => {
        if (getCookie("cookieTest")) {
            alert("Cookies enabled! Proceeding to login...");
            // Cookies work! Now you can safely use them later for JWT.
        } else {
            alert("Please enable cookies for full functionality.");
            // Consider localStorage fallback here
        }
    }, 100);
}

function fetchAndDisplayPdf(path) {
    // Show loading state
    const overlay = document.getElementById('pdfOverlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="loading">Loading PDF...</div>';

    // Encode the path to handle special characters
    const encodedPath = encodeURIComponent(path);

    // Fetch PDF from server
    fetch(`/GetPdf?path=${encodedPath}`, {
        headers: {
            'Authorization': `Bearer ${getCookie('jwtToken')}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error(response.message);
            return response.blob();
        })
        .then(blob => {
            // Create object URL for the PDF
            const pdfUrl = URL.createObjectURL(blob);

            // Initialize PDF.js viewer
            overlay.innerHTML = `
            <div class="pdf-container">
                <button class="close-btn" onclick="closePdfViewer()">×</button>
                <div class="pdf-viewer-container">
                    <canvas id="pdfCanvas"></canvas>
                </div>
                <div class="pdf-controls">
                    <button class="prev-page">Previous</button>
                    <span class="page-info">Page <span id="currentPage">1</span> of <span id="totalPages">0</span></span>
                    <button class="next-page">Next</button>
                </div>
                <div class="pdf-actions">
                    <a href="${pdfUrl}" download="${getFileNameFromPath(path)}" class="btn btn-download">Download PDF</a>
                </div>
            </div>
        `;

            // Load PDF.js if not already loaded
            if (typeof pdfjsLib === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js';
                script.onload = () => {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
                    renderPdfWithJs(pdfUrl);
                };
                document.head.appendChild(script);
            } else {
                renderPdfWithJs(pdfUrl);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            overlay.innerHTML = `
            <div class="pdf-container">
                <button class="close-btn" onclick="closePdfViewer()">×</button>
                <div class="error-message">Error loading PDF: ${error.message}</div>
            </div>
        `;
        });
}

function renderPdfWithJs(pdfUrl) {
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    const scale = 1.5;

    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');

    // Previous/Next buttons
    document.querySelector('.prev-page').addEventListener('click', () => {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    });

    document.querySelector('.next-page').addEventListener('click', () => {
        if (pdfDoc && pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    });

    // Load the PDF
    pdfjsLib.getDocument(pdfUrl).promise.then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        totalPagesEl.textContent = pdfDoc.numPages;

        // Initial/first page rendering
        renderPage(pageNum);
    });

    function renderPage(num) {
        pageRendering = true;

        pdfDoc.getPage(num).then(function (page) {
            const viewport = page.getViewport({ scale: scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);

            renderTask.promise.then(function () {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        currentPageEl.textContent = num;
    }

    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }
}

function closePdfViewer() {
    document.getElementById('pdfOverlay').style.display = 'none';
    // Revoke object URLs to free memory
    const iframe = document.getElementById('pdfViewer');
    if (iframe && iframe.src) {
        URL.revokeObjectURL(iframe.src);
    }
    caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
    });
}

function getFileNameFromPath(path) {
    return path.split('/').pop() || 'document.pdf';
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

        let typingTimer;
        const delay = 500;
        function handleSearch() {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                const data = document.getElementById("search").value.trim().toLowerCase();
                const arr = document.getElementsByClassName("book-card");

                for (let x of arr) {
                    let check = false; // Default: Assume not hidden
                    let words = data.split(" ");

                    for (let d of words) {
                        console.log(x.textContent); // Debugging
                        if (x.textContent.toLowerCase().includes(d)) {
                            check = true; // Found match
                            break;
                        }
                    }

                    // Show if match found, otherwise hide
                    x.style.display = check ? "block" : "none";
                }

            }, delay);
}
function c() {

}