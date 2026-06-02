/* ══════════════════════════════════════════════
   ART-GALLERY.JS — Grid, Watermark, Lightbox
══════════════════════════════════════════════ */

let artworks = [];
let filteredArtworks = [];
let currentLbIndex = 0;

// Fisher-Yates Shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── Load artworks from JSON ───────────────────
async function loadArtworks() {
  try {
    const res = await fetch('data/artworks.json');
    const data = await res.json();
    artworks = shuffle(data);
    filteredArtworks = [...artworks];
    renderGallery();
  } catch (e) {
    // Keep placeholder if JSON fails
    console.log('No artworks.json found. Add your paintings and update data/artworks.json');
  }
}

// ── Render Gallery ────────────────────────────
function renderGallery() {
  const grid = document.getElementById('artGrid');
  if (!filteredArtworks.length) {
    grid.innerHTML = `
      <div class="art-placeholder">
        <div class="placeholder-icon">🎨</div>
        <p>Upload your paintings to <code>assets/paintings/</code><br>and update <code>data/artworks.json</code></p>
      </div>`;
    return;
  }

  grid.innerHTML = filteredArtworks.map((art, i) => `
    <div class="art-item" data-index="${i}" onclick="openLightbox(${i})">
      <img
        src="${art.src}"
        alt="${art.title}"
        loading="lazy"
        draggable="false"
        oncontextmenu="return false"
      />
      <div class="art-watermark-tiled" id="wm${i}"></div>
      <div class="art-overlay">
        <h4>${art.title}</h4>
        <p>${art.description || ''}</p>
      </div>
    </div>
  `).join('');

  // Inject tiled watermarks
  filteredArtworks.forEach((_, i) => {
    injectWatermark(`wm${i}`);
  });

  // Stagger reveal
  grid.querySelectorAll('.art-item').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * 80);
  });
}

// ── Inject tiled watermark ────────────────────
function injectWatermark(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const text = '_.art_and_more._';
  // Place watermark spans across the image
  const positions = [
    { top: '20%', left: '5%' },
    { top: '50%', left: '50%' },
    { top: '75%', left: '15%' },
    { top: '35%', left: '60%' },
  ];
  positions.forEach(pos => {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.top = pos.top;
    span.style.left = pos.left;
    el.appendChild(span);
  });
}


// ══════════ LIGHTBOX ══════════════════════════

function openLightbox(index) {
  currentLbIndex = index;
  updateLightbox();
  document.getElementById('artLightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('artLightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function updateLightbox() {
  const art = filteredArtworks[currentLbIndex];
  if (!art) return;
  document.getElementById('lbImage').src  = art.src;
  document.getElementById('lbImage').alt  = art.title;
  document.getElementById('lbTitle').textContent  = art.title;
  document.getElementById('lbDesc').textContent   = art.description || '';
}

function lbNavPrev() {
  currentLbIndex = (currentLbIndex - 1 + filteredArtworks.length) % filteredArtworks.length;
  updateLightbox();
}

function lbNavNext() {
  currentLbIndex = (currentLbIndex + 1) % filteredArtworks.length;
  updateLightbox();
}

document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', lbNavPrev);
document.getElementById('lbNext').addEventListener('click', lbNavNext);

document.getElementById('artLightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('artLightbox')) closeLightbox();
});

// Expose for keyboard nav
window.closeLightbox = closeLightbox;
window.lbNavPrev     = lbNavPrev;
window.lbNavNext     = lbNavNext;

// ── Init ──────────────────────────────────────
loadArtworks();