// ══════════════════════════════════════════
// AUTH & GLOBAIS
// ══════════════════════════════════════════
const PU='agente', PP='sinodo47b';
let currentDocId = null;
let pendingBlockId = null;
let pendingPassword = null;

function tryLogin(){
  const u=document.getElementById('login-user').value.trim().toLowerCase();
  const p=document.getElementById('login-pass').value;
  const e=document.getElementById('login-error');
  if(u===PU&&p===PP){
    const ls=document.getElementById('login-screen');
    ls.style.transition='opacity .5s';ls.style.opacity='0';
    setTimeout(()=>{ls.style.display='none';document.getElementById('app').classList.add('visible');},500);
  } else {
    e.textContent='Credenciais inválidas. Acesso negado.';
    document.getElementById('login-pass').value='';
    setTimeout(()=>e.textContent='',3000);
  }
}
function logout(){
  document.getElementById('app').classList.remove('visible');
  const ls=document.getElementById('login-screen');
  ls.style.display='flex';ls.style.opacity='1';
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
}

document.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    const ls=document.getElementById('login-screen');
    if(ls.style.display!=='none'&&ls.style.opacity!=='0') tryLogin();
    else if(document.getElementById('pwd-overlay').classList.contains('open')) handlePwdSubmit();
  }
  if(e.key==='Escape' && document.getElementById('pwd-overlay').classList.contains('open')) closePwdModal();
});

// ══════════════════════════════════════════
// NAVEGAÇÃO GERAL E LORE
// ══════════════════════════════════════════
function showPage(id,tab){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  if(tab) tab.classList.add('active');
  if(id==='map') initMap();
}
function gotoTab(idx){
  const tabs=document.querySelectorAll('.nav-tab');
  if(tabs[idx]) tabs[idx].click();
}
function showOpTab(id,btn){
  const sec=document.getElementById('op-'+id);
  if(!sec) return;
  const p=sec.closest('.page-inner');
  if(p){
    p.querySelectorAll('.op-section').forEach(s=>s.classList.remove('active'));
    p.querySelectorAll('.op-tab-btn').forEach(b=>b.classList.remove('active'));
  }
  sec.classList.add('active');
  if(btn) btn.classList.add('active');
}
function showSection(id, linkEl) {
  document.querySelectorAll('.lore-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link, .tb-link').forEach(l => l.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  if (sec) sec.classList.add('active');
  if (linkEl) {
    linkEl.classList.add('active');
    document.querySelectorAll('.sidebar-link').forEach(l => {
      if ((l.getAttribute('onclick') || '').includes("'" + id + "'")) l.classList.add('active');
    });
  } else {
    document.querySelectorAll('.sidebar-link').forEach(l => {
      if ((l.getAttribute('onclick') || '').includes("'" + id + "'")) l.classList.add('active');
    });
  }
  document.querySelector('.lore-main').scrollTo({ top: 0, behavior: 'smooth' });
}

// ══════════════════════════════════════════
// UTILS & PDF
// ══════════════════════════════════════════
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500);}
function clearDoc(id){
  const el=document.getElementById(id);if(!el)return;
  el.querySelectorAll('input[type=text],input[type=number],textarea').forEach(e=>e.value='');
  el.querySelectorAll('input[type=checkbox]').forEach(e=>e.checked=false);
  el.querySelectorAll('select').forEach(e=>e.selectedIndex=0);
  el.querySelectorAll('.rbox').forEach(e=>e.classList.remove('filled'));
  showToast('Formulário limpo.');
}
function rateBox(box){
  const row=box.closest('.rboxes');
  const boxes=row.querySelectorAll('.rbox');
  const idx=Array.from(boxes).indexOf(box);
  boxes.forEach((b,i)=>i<=idx?b.classList.add('filled'):b.classList.remove('filled'));
}
function toggleFS(){
  const docEl=document.documentElement,doc=window.document;const btn=document.getElementById('btn-fs');
  const req=docEl.requestFullscreen||docEl.mozRequestFullScreen||docEl.webkitRequestFullScreen||docEl.msRequestFullscreen;
  const exit=doc.exitFullscreen||doc.mozCancelFullScreen||doc.webkitExitFullscreen||doc.msExitFullscreen;
  if(!doc.fullscreenElement&&!doc.mozFullScreenElement&&!doc.webkitFullscreenElement){req.call(docEl);btn.textContent='Sair da Tela Cheia';}
  else{exit.call(doc);btn.textContent='Tela Cheia';}
}
function selectClassify(el){document.querySelectorAll('.classify-opt').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');}
function submitRequisition(){showToast('✦  Requisição enviada ao Supervisor Varik para análise  ✦');}

async function exportPDF(docId, filename){
  const el=document.getElementById(docId);
  if(!el){ showToast('Formulário não encontrado.'); return; }
  const overlay=document.getElementById('pdf-overlay');
  overlay.classList.add('show');
  const btns=el.querySelectorAll('button,input[type=button]');
  btns.forEach(b=>b.style.visibility='hidden');
  const stamps=el.querySelectorAll('.stamp');
  stamps.forEach(s=>s.style.opacity='0.4');
  const originalWidth=el.style.width, originalMaxWidth=el.style.maxWidth, originalMargin=el.style.margin, originalBorderRadius=el.style.borderRadius;
  el.style.width='820px'; el.style.maxWidth='820px'; el.style.margin='0'; el.style.borderRadius='0';
  await new Promise(r=>setTimeout(r,120));
  try {
    const canvas=await html2canvas(el,{ scale:2, useCORS:true, logging:false, backgroundColor:'#f0e6c0', width:820, windowWidth:900, onclone:(clonedDoc)=>{ clonedDoc.querySelectorAll('.stamp').forEach(s=>s.style.opacity='0.3'); } });
    const { jsPDF }=window.jspdf;
    const imgData=canvas.toDataURL('image/jpeg',0.95);
    const pdfW=210; const ratio=canvas.height/canvas.width; const pdfH=pdfW*ratio;
    const pageHeightPx=297*(canvas.width/pdfW); 
    const totalPages=Math.ceil(canvas.height/pageHeightPx);
    const pdf=new jsPDF({ orientation: 'portrait', unit:'mm', format:'a4' });
    if(totalPages<=1){ pdf.addImage(imgData,'JPEG',0,0,pdfW,Math.min(pdfH,297),undefined,'FAST'); } 
    else {
      for(let page=0;page<totalPages;page++){
        if(page>0) pdf.addPage();
        const srcY=page*pageHeightPx; const srcH=Math.min(pageHeightPx, canvas.height-srcY);
        const pageCanvas=document.createElement('canvas'); pageCanvas.width=canvas.width; pageCanvas.height=srcH;
        const ctx=pageCanvas.getContext('2d'); ctx.drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH);
        const pageImg=pageCanvas.toDataURL('image/jpeg',0.95); const pageH=(srcH/canvas.width)*pdfW;
        pdf.addImage(pageImg,'JPEG',0,0,pdfW,pageH,undefined,'FAST');
      }
    }
    pdf.save(filename+'_SQV.pdf');
    showToast('✦  PDF exportado com sucesso  ✦');
  } catch(err){
    console.error(err); showToast('Erro ao gerar PDF. Tente novamente.');
  }
  el.style.width=originalWidth; el.style.maxWidth=originalMaxWidth; el.style.margin=originalMargin; el.style.borderRadius=originalBorderRadius;
  btns.forEach(b=>b.style.visibility=''); stamps.forEach(s=>s.style.opacity=''); overlay.classList.remove('show');
}

// ══════════════════════════════════════════
// INICIALIZAÇÃO DE DADOS
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => { 
  if(document.getElementById('docs-grid')){
    const grid=document.getElementById('docs-grid');grid.innerHTML='';
    DOCS.forEach(doc=>{
      const card=document.createElement('div');card.className='doc-card';
      card.innerHTML=`<div class="doc-card-header"><div class="doc-classif-tag ${doc.classif}">${doc.classifLabel}</div><div class="doc-number">${doc.number}</div><div class="doc-title">${doc.title}</div><div class="doc-subtitle">${doc.subtitle}</div></div><div class="doc-card-body"><p class="doc-desc">${doc.desc}</p><div class="doc-meta-row"><div class="doc-meta">Origem: <span>${doc.origin}</span></div><div class="doc-meta">Data: <span>${doc.date}</span></div></div><div class="doc-locked-bar"><span class="doc-lock-icon">🔒</span><span class="doc-lock-hint">Acesso protegido por código</span><button class="doc-access-btn" onclick="openDocPwd('${doc.id}')">Acessar</button></div></div>`;
      grid.appendChild(card);
    });
  }
  if(document.getElementById('bestiary-grid')) renderBeasts(); 
  if(document.getElementById('glossary-grid')) renderGlossary(); 
});

function handlePwdSubmit() {
  if (pendingBlockId) confirmUnlock();
  else if (currentDocId) {
    if (window.isGlossaryPwd) window.confirmPwd();
    else confirmDocPwd();
  }
}

// ══════════════════════════════════════════
// SENHAS DOCUMENTOS
// ══════════════════════════════════════════
function openDocPwd(id){
  const doc=DOCS.find(d=>d.id===id); currentDocId=id; pendingBlockId=null; window.isGlossaryPwd = false;
  document.getElementById('pwd-modal-doc').textContent=doc.title;
  document.getElementById('pwd-input').value='';
  document.getElementById('pwd-modal-err').textContent='';
  document.getElementById('pwd-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('pwd-input').focus(),100);
}
function confirmDocPwd(){
  const doc=DOCS.find(d=>d.id===currentDocId);
  const val=document.getElementById('pwd-input').value.trim().toLowerCase();
  if(val===doc.password){ closePwdModal(); openDocReader(doc); }
  else{ document.getElementById('pwd-modal-err').textContent='Código incorreto. Acesso negado.'; document.getElementById('pwd-input').value=''; setTimeout(()=>document.getElementById('pwd-modal-err').textContent='',3000); }
}
function openDocReader(doc){
  const reader=document.getElementById('doc-reader');
  reader.innerHTML=`<div class="doc-reader-header"><div><div class="doc-reader-classif ${doc.classif}">${doc.classifLabel.toUpperCase()} — ${doc.number}</div><div class="doc-reader-title">${doc.title}</div><div class="doc-reader-number">${doc.subtitle}</div></div><button class="doc-reader-close" onclick="closeReader()">✕ Fechar</button></div><div class="doc-reader-body" style="position:relative;"><div class="doc-watermark">${doc.classifLabel.toUpperCase()}</div>${doc.content}</div>`;
  document.getElementById('reader-overlay').classList.add('open');
  reader.scrollTop=0;
}
function closePwdModal(){
  document.getElementById('pwd-overlay').classList.remove('open');
  currentDocId=null; pendingBlockId=null; pendingPassword=null;
}
function closeReader(){document.getElementById('reader-overlay').classList.remove('open');}
function closeReaderOnBg(e){if(e.target===document.getElementById('reader-overlay'))closeReader();}

// ══════════════════════════════════════════
// SENHAS LORE CENSURADA
// ══════════════════════════════════════════
function unlockCensored(blockId, password, title) {
  pendingBlockId = blockId; pendingPassword = password; currentDocId = null; window.isGlossaryPwd = false;
  document.getElementById('pwd-modal-doc').textContent = title;
  document.getElementById('pwd-input').value = '';
  document.getElementById('pwd-modal-err').textContent = '';
  document.getElementById('pwd-overlay').classList.add('open');
  setTimeout(() => document.getElementById('pwd-input').focus(), 100);
}
function confirmUnlock() {
  const val = document.getElementById('pwd-input').value.trim().toLowerCase();
  if (val === pendingPassword) {
    const block = document.getElementById(pendingBlockId);
    if (block) block.classList.add('unlocked');
    closePwdModal(); showToast('✦  Acesso concedido  ✦');
  } else {
    document.getElementById('pwd-modal-err').textContent = 'Código incorreto. Acesso negado.';
    document.getElementById('pwd-input').value = '';
    setTimeout(() => document.getElementById('pwd-modal-err').textContent = '', 3000);
  }
}

// ══════════════════════════════════════════
// BESTIÁRIO
// ══════════════════════════════════════════
let currentBeastFilter='all';
function renderBeasts(filter='all',search=''){
  const grid=document.getElementById('bestiary-grid'); if(!grid) return;
  grid.innerHTML='';
  BEASTS.filter(b=>{
    const mf=filter==='all'||b.rarity===filter;
    const ms=search===''||b.name.toLowerCase().includes(search.toLowerCase())||b.desc.toLowerCase().includes(search.toLowerCase());
    return mf&&ms;
  }).forEach(b=>{
    const card=document.createElement('div');card.className='beast-card';
    card.innerHTML=`<div class="beast-header"><div class="beast-icon">${b.icon}</div><div class="beast-header-info"><div class="beast-name">${b.name}</div><div class="beast-type">${b.type}</div><div class="beast-tags"><span class="beast-tag ${b.rarity}">${b.rarity.charAt(0).toUpperCase()+b.rarity.slice(1)}</span><span class="beast-tag cr">CR ${b.cr}</span></div></div></div><div class="beast-body"><div class="beast-desc">${b.desc}</div><div class="beast-stats"><div class="beast-stat">PV <span>${b.hp}</span></div><div class="beast-stat">CA <span>${b.ac}</span></div><div class="beast-stat">Mov <span>${b.speed}</span></div></div><div class="beast-lore">${b.lore}</div></div>`;
    grid.appendChild(card);
  });
}
function setBeastFilter(f,btn){
  currentBeastFilter=f; document.querySelectorAll('.bestiary-filter').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  renderBeasts(f,document.querySelector('.bestiary-search').value);
}
function filterBeasts(v){renderBeasts(currentBeastFilter,v);}

// ══════════════════════════════════════════
// GLOSSÁRIO
// ══════════════════════════════════════════
function renderGlossary(filter = '') {
  const grid = document.getElementById('glossary-grid');
  if (!grid) return;
  grid.innerHTML = '';
  GLOSSARY.filter(item => item.term.toLowerCase().includes(filter.toLowerCase()) || item.desc.toLowerCase().includes(filter.toLowerCase())).forEach(item => {
    const card = document.createElement('div'); card.className = 'doc-card';
    const content = item.restricted 
      ? `<div class="doc-locked-bar"><span class="doc-lock-icon">🔒</span><span class="doc-lock-hint">Acesso Restrito - Nível IV</span><button class="doc-access-btn" onclick="openGlossaryPwd('${item.id}')">Acessar</button></div>`
      : `<p class="doc-desc">${item.desc}</p>`;
    card.innerHTML = `<div class="doc-card-header"><div class="doc-classif-tag ${item.restricted ? 'confidencial' : 'uso-interno'}">${item.category}</div><div class="doc-title">${item.term}</div></div><div class="doc-card-body">${content}</div>`;
    grid.appendChild(card);
  });
}
function filterGlossary(v) { renderGlossary(v); }

function openGlossaryPwd(id) {
  const item = GLOSSARY.find(g => g.id === id);
  currentDocId = id; pendingBlockId = null; window.isGlossaryPwd = true;
  document.getElementById('pwd-modal-doc').textContent = "Codex: " + item.term;
  document.getElementById('pwd-input').value = '';
  document.getElementById('pwd-modal-err').textContent = '';
  document.getElementById('pwd-overlay').classList.add('open');
  
  window.confirmPwd = function() {
    const val = document.getElementById('pwd-input').value.trim().toLowerCase();
    if(val === item.password) {
      closePwdModal(); showSecretLore(item); window.isGlossaryPwd = false;
    } else {
      document.getElementById('pwd-modal-err').textContent = 'Código de acesso inválido.';
    }
  };
}

function showSecretLore(item) {
  const reader = document.getElementById('doc-reader');
  reader.innerHTML = `<div class="doc-reader-header"><div><div class="doc-reader-classif confidencial">ARQUIVO DE LORE — NÍVEL IV</div><div class="doc-reader-title">${item.term}</div></div><button class="doc-reader-close" onclick="closeReader()">✕ Fechar</button></div><div class="doc-reader-body"><div class="doc-watermark">CONFIDENCIAL</div><div class="doc-seal-line">Sínodo do Quinto Véu · Acervo Histórico</div><p class="doc-body-text" style="font-size: 1.15rem;">${item.desc}</p><div class="doc-divider">· · ✦ · ·</div></div>`;
  document.getElementById('reader-overlay').classList.add('open');
}

// ══════════════════════════════════════════
// MAPA IMAGEM (PAN E ZOOM)
// ══════════════════════════════════════════
let mapImgScale=1, mapImgOffX=0, mapImgOffY=0, mapImgDragging=false, mapImgLastX=0, mapImgLastY=0, mapInited=false;

function initMap(){
  if(mapInited) return; mapInited=true;
  const mapWrapper = document.getElementById('map-image-wrapper');
  const mapImg = document.getElementById('map-image');
  if(!mapWrapper || !mapImg) return;

  mapWrapper.addEventListener('mousedown', e => {
    mapImgDragging = true; mapImgLastX = e.clientX; mapImgLastY = e.clientY;
  });
  window.addEventListener('mousemove', e => {
    if(!mapImgDragging) return;
    mapImgOffX += (e.clientX - mapImgLastX) / mapImgScale;
    mapImgOffY += (e.clientY - mapImgLastY) / mapImgScale;
    mapImgLastX = e.clientX; mapImgLastY = e.clientY;
    applyMapImgTransform();
  });
  window.addEventListener('mouseup', () => mapImgDragging = false);
  window.addEventListener('mouseleave', () => mapImgDragging = false);
  
  mapWrapper.addEventListener('wheel', e => {
    e.preventDefault();
    mapImgZoom(e.deltaY < 0 ? 1.1 : 0.9);
  }, {passive: false});
}

function applyMapImgTransform() {
  const mapImg = document.getElementById('map-image');
  if(mapImg) mapImg.style.transform = `scale(${mapImgScale}) translate(${mapImgOffX}px, ${mapImgOffY}px)`;
}
function mapImgZoom(f) {
  mapImgScale = Math.min(5, Math.max(0.2, mapImgScale * f));
  applyMapImgTransform();
}
function mapImgReset() {
  mapImgScale = 1; mapImgOffX = 0; mapImgOffY = 0;
  applyMapImgTransform();
}