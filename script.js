function bindText(inputId, outId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.addEventListener('input', (e) => {
      document.getElementById(outId).innerHTML = e.target.value.replace(/\n/g, '<br>');
    });
  }
}

bindText('inDate', 'outDate');
bindText('inName', 'outName');
bindText('inDesc', 'outDesc');
bindText('inRight1', 'outRight1');
bindText('inRight2', 'outRight2');

// Carga de imagen
document.getElementById('inPhoto').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    document.getElementById('outPhoto').src = event.target.result;
  }
  reader.readAsDataURL(file);
});

// Lógica de Zoom
const template = document.getElementById('flyer-template');
const zoomRange = document.getElementById('zoomRange');

function updateZoom() {
  const scale = parseFloat(zoomRange.value);
  template.style.transform = `scale(${scale})`;
  template.style.marginBottom = `-${1000 * (1 - scale)}px`;
}

zoomRange.addEventListener('input', updateZoom);

// Ajuste automático para mobile
if (window.innerWidth <= 900) {
  zoomRange.value = 0.4;
} else {
  zoomRange.value = 0.6;
}
updateZoom();

// Lógica Modal Mobile (FAB)
const fab = document.getElementById('fabPreview');
const modal = document.getElementById('previewModal');
const closeBtn = document.getElementById('closeModalBtn');

fab.addEventListener('click', () => {
  modal.classList.add('modal-active');
});

closeBtn.addEventListener('click', () => {
  modal.classList.remove('modal-active');
});

// Descargar con html2canvas
document.getElementById('downloadBtn').addEventListener('click', () => {
  const btn = document.getElementById('downloadBtn');
  const oldText = btn.innerText;
  btn.innerText = "⏳ Generando imagen...";
  
  const originalTransform = template.style.transform;
  const originalMargin = template.style.marginBottom;
  
  template.style.transform = 'none';
  template.style.marginBottom = '0';

  html2canvas(template, { 
    scale: 2, 
    useCORS: true,
    backgroundColor: null 
  }).then(canvas => {
    const link = document.createElement('a');
    let guestName = document.getElementById('inName').value;
    if(!guestName || guestName === "Nombre Invitado") guestName = "invitado";
    link.download = `flyer_coyatv_${guestName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    template.style.transform = originalTransform;
    template.style.marginBottom = originalMargin;
    btn.innerText = oldText;
    
    // Cerramos el modal en mobile luego de descargar
    modal.classList.remove('modal-active');
  });
});
