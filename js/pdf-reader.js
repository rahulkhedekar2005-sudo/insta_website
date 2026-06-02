/* ══════════════════════════════════════════════
   PDF-READER.JS — Full PDF Reader with all features
══════════════════════════════════════════════ */

// ── State ────────────────────────────────────
let pdfDoc       = null;
let currentPage  = 1;
let totalPages   = 0;
let zoomLevel    = 1.0;
let highlightMode = false;
let bookmarks    = {};   // { bookTitle: [pageNums] }
let currentBookTitle = '';
let isHighlighting = false;
let hlStart      = { x: 0, y: 0 };
let darkMode     = false;

// ── DOM refs ─────────────────────────────────
const modal        = document.getElementById('pdfModal');
const canvas       = document.getElementById('pdfCanvas');
const ctx          = canvas.getContext('2d');
const hlLayer      = document.getElementById('highlightLayer');
const loadingEl    = document.getElementById('pdfLoading');
const canvasWrap   = document.getElementById('pdfCanvasWrap');
const viewerArea   = document.getElementById('pdfViewerArea');

// ── Load Books from JSON ──────────────────────
async function loadBooks() {
  try {
    const res = await fetch('data/books.json');
    const books = await res.json();
    renderBooks(books);
  } catch (e) {
    console.log('No books.json found. Add PDFs to assets/books/ and update data/books.json');
  }
}

function renderBooks(books) {
  const grid = document.getElementById('booksGrid');
  if (!books || !books.length) return;

  grid.innerHTML = books.map(book => `
    <div class="book-card-item" onclick="openBook('${book.pdf}', '${escHtml(book.title)}')">
      <div class="book-cover-wrap">
        ${book.cover
          ? `<img class="book-cover-img" src="${book.cover}" alt="${escHtml(book.title)}" draggable="false" oncontextmenu="return false"/>`
          : `<div class="book-cover-default">
               <span class="book-icon-large">📖</span>
               <span class="book-title-default">${escHtml(book.title)}</span>
               <span class="book-author-default">${escHtml(book.author || '')}</span>
             </div>`
        }
        <div class="book-open-badge"><span>Open Book</span></div>
      </div>
      <div class="book-meta">
        <h4>${escHtml(book.title)}</h4>
        ${book.author ? `<div class="book-author">${escHtml(book.author)}</div>` : ''}
        ${book.genre  ? `<span class="book-genre">${escHtml(book.genre)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function escHtml(str = '') {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════ OPEN BOOK ═════════════════

window.openBook = async function(pdfPath, title) {
  currentBookTitle = title;
  document.getElementById('pdfTitle').textContent = title;
  currentPage = 1;
  zoomLevel   = 1.0;
  updateZoomDisplay();
  clearHighlights();

  modal.classList.add('open');
  document.body.classList.add('pdf-open');
  loadingEl.classList.remove('hidden');

  try {
    pdfDoc = await pdfjsLib.getDocument(pdfPath).promise;
    totalPages = pdfDoc.numPages;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('currentPageInput').max = totalPages;

    // Load saved bookmarks for this book
    loadBookmarksForBook(title);

    await renderPage(currentPage);
  } catch (err) {
    loadingEl.innerHTML = `<p style="color:var(--red)">Could not load PDF.<br>${err.message}</p>`;
    console.error(err);
  }
};

// ══════════════════ RENDER PAGE ═══════════════

async function renderPage(num) {
  loadingEl.classList.remove('hidden');
  clearHighlights();

  const page     = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: zoomLevel * 1.5 });

  canvas.width  = viewport.width;
  canvas.height = viewport.height;
  hlLayer.style.width  = viewport.width  + 'px';
  hlLayer.style.height = viewport.height + 'px';

  await page.render({ canvasContext: ctx, viewport }).promise;

  loadingEl.classList.add('hidden');
  currentPage = num;
  document.getElementById('currentPageInput').value = num;

  // Scroll to top of viewer
  viewerArea.scrollTo({ top: 0, behavior: 'smooth' });

  // Re-draw any bookmarked page indicator
  updateBookmarkIcon();
}

// ══════════════════ PAGE CONTROLS ══════════════

function changePage(delta) {
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) renderPage(newPage);
}

document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
document.getElementById('nextPage').addEventListener('click', () => changePage(1));
window.changePage = changePage;

document.getElementById('currentPageInput').addEventListener('change', e => {
  const p = parseInt(e.target.value);
  if (p >= 1 && p <= totalPages) renderPage(p);
});

// ══════════════════ ZOOM ══════════════════════

function updateZoomDisplay() {
  document.getElementById('zoomLevel').textContent = Math.round(zoomLevel * 100) + '%';
}

document.getElementById('zoomIn').addEventListener('click', () => {
  if (zoomLevel < 3.0) { zoomLevel = Math.min(3.0, zoomLevel + 0.15); updateZoomDisplay(); renderPage(currentPage); }
});

document.getElementById('zoomOut').addEventListener('click', () => {
  if (zoomLevel > 0.4) { zoomLevel = Math.max(0.4, zoomLevel - 0.15); updateZoomDisplay(); renderPage(currentPage); }
});

// ══════════════════ HIGHLIGHT ═════════════════

document.getElementById('toggleHighlight').addEventListener('click', () => {
  highlightMode = !highlightMode;
  document.getElementById('toggleHighlight').classList.toggle('active', highlightMode);
  modal.classList.toggle('highlight-active', highlightMode);
});

canvasWrap.addEventListener('mousedown', e => {
  if (!highlightMode) return;
  isHighlighting = true;
  const rect = canvas.getBoundingClientRect();
  hlStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
});

canvasWrap.addEventListener('mouseup', e => {
  if (!highlightMode || !isHighlighting) return;
  isHighlighting = false;
  const rect = canvas.getBoundingClientRect();
  const x2   = e.clientX - rect.left;
  const y2   = e.clientY - rect.top;
  const w    = x2 - hlStart.x;
  const h    = y2 - hlStart.y;

  if (Math.abs(w) > 10 && Math.abs(h) > 4) {
    const div = document.createElement('div');
    div.className = 'highlight-rect';
    div.style.left   = Math.min(hlStart.x, x2) + 'px';
    div.style.top    = Math.min(hlStart.y, y2) + 'px';
    div.style.width  = Math.abs(w) + 'px';
    div.style.height = Math.abs(h) + 'px';
    hlLayer.appendChild(div);
  }
});

function clearHighlights() {
  hlLayer.innerHTML = '';
}

// ══════════════════ BOOKMARKS ═════════════════

function loadBookmarksForBook(title) {
  const stored = localStorage.getItem('bookmarks_' + title);
  bookmarks[title] = stored ? JSON.parse(stored) : [];
  renderBookmarkList();
}

function saveBookmarks() {
  localStorage.setItem('bookmarks_' + currentBookTitle, JSON.stringify(bookmarks[currentBookTitle] || []));
}

document.getElementById('addBookmark').addEventListener('click', () => {
  const book = currentBookTitle;
  if (!bookmarks[book]) bookmarks[book] = [];
  const pages = bookmarks[book];

  if (!pages.includes(currentPage)) {
    pages.push(currentPage);
    pages.sort((a, b) => a - b);
    saveBookmarks();
    renderBookmarkList();
    flashBtn('addBookmark');
  }
  updateBookmarkIcon();
});

function renderBookmarkList() {
  const list  = document.getElementById('bookmarkList');
  const empty = document.getElementById('bmEmpty');
  const pages = bookmarks[currentBookTitle] || [];

  list.innerHTML = pages.map(p => `
    <li onclick="renderPage(${p})">
      <span>📌 Page ${p}</span>
      <span class="bm-del" onclick="removeBookmark(event, ${p})">✕</span>
    </li>
  `).join('');

  empty.style.display = pages.length ? 'none' : 'block';
}

window.removeBookmark = function(e, page) {
  e.stopPropagation();
  const pages = bookmarks[currentBookTitle] || [];
  bookmarks[currentBookTitle] = pages.filter(p => p !== page);
  saveBookmarks();
  renderBookmarkList();
  updateBookmarkIcon();
};

function updateBookmarkIcon() {
  const pages   = bookmarks[currentBookTitle] || [];
  const btn     = document.getElementById('addBookmark');
  const isMarked = pages.includes(currentPage);
  btn.classList.toggle('active', isMarked);
  btn.title = isMarked ? 'Page bookmarked' : 'Bookmark this page';
}

document.getElementById('toggleBookmarks').addEventListener('click', () => {
  const panel = document.getElementById('bookmarksPanel');
  panel.classList.toggle('open');
  document.getElementById('toggleBookmarks').classList.toggle('active', panel.classList.contains('open'));
});

// ══════════════════ DARK MODE ═════════════════

document.getElementById('toggleDark').addEventListener('click', () => {
  darkMode = !darkMode;
  modal.classList.toggle('dark-mode', darkMode);
  document.getElementById('toggleDark').classList.toggle('active', darkMode);
});

// ══════════════════ BACK / CLOSE ══════════════

document.getElementById('pdfBack').addEventListener('click', closeReader);

function closeReader() {
  modal.classList.remove('open');
  document.body.classList.remove('pdf-open');
  pdfDoc = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  loadingEl.classList.remove('hidden');
}

// ══════════════════ HELPERS ═══════════════════

function flashBtn(id) {
  const btn = document.getElementById(id);
  btn.style.transform = 'scale(1.2)';
  setTimeout(() => btn.style.transform = '', 200);
}

// ── Init ──────────────────────────────────────
loadBooks();