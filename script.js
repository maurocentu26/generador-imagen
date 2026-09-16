// ─── ESTADO ───────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'coyatv_history';
const MAX_HISTORY = 5;

let currentPhotoDataUrl = null; // foto actual en base64

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Lee los valores del formulario */
function getFormValues() {
  return {
    date: document.getElementById('inDate').value,
    name: document.getElementById('inName').value,
    desc: document.getElementById('inDesc').value,
    photo: currentPhotoDataUrl
  };
}

/** Aplica valores al formulario + plantilla */
function applyValues(v) {
  document.getElementById('inDate').value = v.date || '';
  document.getElementById('inName').value = v.name || '';
  document.getElementById('inDesc').value = v.desc || '';

  document.getElementById('outDate').innerHTML = (v.date || '').replace(/\n/g, '<br>');
  document.getElementById('outName').innerHTML = (v.name || '').replace(/\n/g, '<br>');
  document.getElementById('outDesc').innerHTML = (v.desc || '').replace(/\n/g, '<br>');

  if (v.photo) {
    currentPhotoDataUrl = v.photo;
    renderPhotoOnCanvas(v.photo);
  }
}

// ─── SINCRONIZACIÓN TEXTO ─────────────────────────────────────────────────────

function bindText(inputId, outId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.addEventListener('input', (e) => {
      document.getElementById(outId).innerHTML = e.target.value.replace(/\n/g, '<br>');
      autosave();
    });
  }
}

bindText('inDate', 'outDate');
bindText('inName', 'outName');
bindText('inDesc', 'outDesc');

// ─── FOTO: render con canvas interno para fix de object-fit ───────────────────

/**
 * Dibuja la foto del invitado en un <canvas> interno (dentro de .t-image-box)
 * simulando object-fit: cover. Esto hace que html2canvas la capture correctamente.
 */
function renderPhotoOnCanvas(dataUrl) {
  const box = document.getElementById('photoBox');
  const W = box.offsetWidth || 360;
  const H = box.offsetHeight || 520;

  // Reemplazamos el contenido del box con un canvas
  box.innerHTML = '';
  const cvs = document.createElement('canvas');
  cvs.width = W;
  cvs.height = H;
  cvs.style.width = '100%';
  cvs.style.height = '100%';
  cvs.style.display = 'block';
  box.appendChild(cvs);

  const ctx = cvs.getContext('2d');
  const img = new Image();
  img.onload = () => {
    const scale = Math.max(W / img.width, H / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    const sx = (W - sw) / 2;
    const sy = (H - sh) / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, sx, sy, sw, sh);
  };
  img.src = dataUrl;
}

document.getElementById('inPhoto').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    currentPhotoDataUrl = event.target.result;
    renderPhotoOnCanvas(currentPhotoDataUrl);
    autosave();
  };
  reader.readAsDataURL(file);
});

// ─── ZOOM ─────────────────────────────────────────────────────────────────────

const template = document.getElementById('flyer-template');
const zoomRange = document.getElementById('zoomRange');

function updateZoom() {
  const scale = parseFloat(zoomRange.value);
  template.style.transform = `scale(${scale})`;
  // Compensar el espacio vacío que deja el elemento escalado
  template.style.marginBottom = `-${1000 * (1 - scale)}px`;
  template.style.marginRight = `-${800 * (1 - scale)}px`;
}

/** Calcula el zoom óptimo para que el flyer entre en el área visible */
function autoZoom() {
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    // En mobile: zoom para que el ancho del flyer (800px) quepa en la pantalla menos padding
    const availableW = window.innerWidth - 24;
    const scale = Math.min(availableW / 800, 0.95);
    zoomRange.value = Math.round(scale * 20) / 20; // redondear a paso de 0.05
  } else {
    zoomRange.value = 0.6;
  }
  updateZoom();
}

zoomRange.addEventListener('input', updateZoom);
autoZoom();
window.addEventListener('resize', autoZoom);

// ─── MODAL MOBILE ─────────────────────────────────────────────────────────────

const fab = document.getElementById('fabPreview');
const modal = document.getElementById('previewModal');
const closeBtn = document.getElementById('closeModalBtn');

fab.addEventListener('click', () => {
  modal.classList.add('modal-active');
  // Re-calcular zoom al abrir (por si cambió la orientación)
  autoZoom();
});
closeBtn.addEventListener('click', () => modal.classList.remove('modal-active'));

// El botón de descarga dentro del modal (mobile) dispara el mismo evento
const downloadBtnModal = document.getElementById('downloadBtnModal');
if (downloadBtnModal) {
  downloadBtnModal.addEventListener('click', () => {
    document.getElementById('downloadBtn').click();
  });
}

// ─── AUTOGUARDADO (ÚLTIMAS 5) ─────────────────────────────────────────────────

function autosave() {
  const values = getFormValues();
  if (!values.name && !values.date && !values.desc && !values.photo) return;

  let history = loadHistory();

  // Evitar duplicados exactos al tope
  const lastEntry = history[0];
  if (
    lastEntry &&
    lastEntry.name === values.name &&
    lastEntry.date === values.date &&
    lastEntry.desc === values.desc &&
    lastEntry.photo === values.photo
  ) return;

  history.unshift({ ...values, savedAt: new Date().toLocaleString('es-AR') });
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const container = document.getElementById('historyList');
  const history = loadHistory();
  container.innerHTML = '';

  if (history.length === 0) {
    container.innerHTML = '<p class="no-history">Aún no hay plantillas guardadas.</p>';
    return;
  }

  history.forEach((entry, idx) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-thumb">
        ${entry.photo ? `<img src="${entry.photo}" alt="foto">` : '<div class="no-photo">Sin foto</div>'}
      </div>
      <div class="history-info">
        <strong>${entry.name || '(sin nombre)'}</strong>
        <span>${entry.date || ''}</span>
        <small>${entry.savedAt}</small>
      </div>
      <button class="history-restore-btn" data-idx="${idx}">Restaurar</button>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.history-restore-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      applyValues(loadHistory()[idx]);
    });
  });
}

// ─── DESCARGA ─────────────────────────────────────────────────────────────────

document.getElementById('downloadBtn').addEventListener('click', () => {
  const btn = document.getElementById('downloadBtn');
  const oldText = btn.innerText;
  btn.innerText = '⏳ Generando imagen...';
  btn.disabled = true;

  // Guardamos antes de descargar
  autosave();

  html2canvas(template, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    // Dimensiones exactas de la plantilla — evita cualquier recorte del contenedor padre
    width: 800,
    height: 1000,
    onclone: (clonedDoc) => {
      const t = clonedDoc.getElementById('flyer-template');

      // Sacamos el elemento del contenedor con overflow/height limitados
      // y lo movemos directamente al body sin restricciones
      t.style.transform = 'none';
      t.style.marginBottom = '0';
      t.style.position = 'absolute';
      t.style.top = '0';
      t.style.left = '0';
      t.style.width = '800px';
      t.style.height = '1000px';
      t.style.overflow = 'hidden';
      t.style.zIndex = '-1';

      clonedDoc.body.style.margin = '0';
      clonedDoc.body.style.padding = '0';
      clonedDoc.body.style.overflow = 'visible';
      clonedDoc.body.style.height = 'auto';
      clonedDoc.body.style.width = '800px';
      clonedDoc.body.appendChild(t);
    }
  }).then(canvas => {
    const link = document.createElement('a');
    let guestName = document.getElementById('inName').value;
    if (!guestName || guestName === 'Nombre Invitado') guestName = 'invitado';
    link.download = `flyer_coyatv_${guestName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    btn.innerText = oldText;
    btn.disabled = false;
    modal.classList.remove('modal-active');
  }).catch(err => {
    console.error('Error al generar imagen:', err);
    btn.innerText = oldText;
    btn.disabled = false;
    alert('Hubo un error al generar la imagen. Revisá la consola para más detalles.');
  });
});

// ─── TOGGLE HISTORIAL ─────────────────────────────────────────────────────────

document.getElementById('toggleHistory').addEventListener('click', () => {
  const section = document.getElementById('historySection');
  const isOpen = section.style.display !== 'none';
  section.style.display = isOpen ? 'none' : 'block';
  document.getElementById('toggleHistory').innerText = isOpen
    ? '🕐 Ver últimas plantillas'
    : '🕐 Ocultar historial';
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
renderHistory();
