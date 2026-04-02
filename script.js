<script>
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
// ARQUIVOS CLASSIFICADOS E SENHAS
// ══════════════════════════════════════════
const DOCS=[
  {id:'doc01',number:'RD-001 · Observatório do Véu',classif:'restrito',classifLabel:'Restrito',title:'A Natureza da Quinta Dimensão',subtitle:'Relatório Introdutório de Pesquisa Arcana',desc:'Compilação dos primeiros estudos formais do Sínodo sobre a estrutura e comportamento da 5ª Dimensão.',origin:'Observatório do Véu',date:'Ano 112 P.V.',password:'veuberto',content:`<div class="doc-seal-line">Observatório do Véu · Porto Varion · Uso Interno</div><div class="doc-section-title">Prefácio do Magistratus</div><p class="doc-body-text">O presente relatório consolida as observações e hipóteses dos primeiros doze anos de pesquisa formal do Sínodo do Quinto Véu. Não é um documento definitivo — a natureza da 5ª Dimensão resiste, por essência, a definições absolutas.</p><div class="doc-section-title">I. Definição Operacional</div><p class="doc-body-text">A <strong>5ª Dimensão</strong> é a camada da realidade imediatamente adjacente à dimensão física (1ª–3ª) e temporal (4ª), caracterizada pela plasticidade estrutural — a capacidade de ser <em>lida, interpretada e, em casos extremos, reescrita</em> por consciências de desenvolvimento cognitivo suficientemente avançado.</p><div class="doc-callout"><div class="doc-callout-label">Nota Técnica</div><p>A "magia" não é invocação de energia. É a capacidade de interpretar as estruturas da 5ª Dimensão e aplicá-las ao plano físico.</p></div><div class="doc-section-title">II. Riscos Identificados</div><ul class="doc-list"><li><strong>Distorção cognitiva progressiva</strong> — em praticantes sem treinamento formal.</li><li><strong>Vazamento dimensional localizado</strong> — fissuras que permitem passagem de entidades.</li><li><strong>Erosão da realidade estável</strong> — em regiões de uso intenso e não regulado.</li></ul><div class="doc-warning"><div class="doc-warning-label">⚠ Aviso do Conclave</div><p>Qualquer percepção dimensional não catalogada em indivíduos fora do Sínodo deve ser reportada imediatamente. A não comunicação constitui violação grave do Tratado de Vhal'Torin.</p></div><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Redigido por</div><div class="doc-sig-name">Magistratus Eldren Soval</div><div class="doc-sig-title">Primeiro Diretor do Observatório do Véu</div></div><div><div class="doc-sig">Ano 112 P.V. · Porto Varion</div></div></div><div class="doc-classified-footer">RD-001 · Restrito · Sínodo do Quinto Véu</div>`},
  {id:'doc02',number:'CD-007 · Departamento Histórico',classif:'confidencial',classifLabel:'Confidencial',title:'A Queda de Aethryon',subtitle:'Transcrição de Relatos de Sobreviventes — Guerra do Véu',desc:'Transcrições dos únicos sete sobreviventes documentados da batalha que destruiu Aethryon.',origin:'Departamento Histórico do Sínodo',date:'Anos 3–11 P.V.',password:'aethryon',content:`<div class="doc-seal-line">Testemunhos Históricos · Confidencial · Departamento Histórico</div><div class="doc-section-title">Testemunho I — Merewyn Ash, ceramista</div><div class="doc-callout"><div class="doc-callout-label">Transcrição</div><p>"Não foi uma explosão. Explosões têm início e fim. Isso foi... um desdobramento. O ar se abriu como um tecido rasgado de dentro para fora. E o que havia do outro lado não era escuridão. Era outra coisa. Coisa que olhava de volta."</p></div><div class="doc-section-title">Testemunho II — Dorvan Yelle, guarda da muralha sul</div><div class="doc-callout"><div class="doc-callout-label">Transcrição</div><p>"Vi sete deles no topo da torre mais alta. Vi quando pararam de ser homens. Não morreram — se tornaram outra coisa. Ficaram de pé. Continuaram de pé. Mas já não havia ninguém dentro."</p></div><div class="doc-section-title">Testemunho III — Criança, aprox. 9 anos.</div><div class="doc-callout"><div class="doc-callout-label">Transcrição</div><p>"A minha rua ainda está lá. Ela está acontecendo ao mesmo tempo. Sempre acontecendo. Os meus pais estão sempre morrendo lá. Eu acho que eles vão continuar morrendo pra sempre."</p></div><div class="doc-warning"><div class="doc-warning-label">⚠ Nota Clínica</div><p>A criança descreveu percepção de <em>loop temporal residual</em>. Ela não foi capaz de distinguir memória de percepção ativa até o fim de sua vida. Faleceu 41 anos depois. Nunca deixou de "ver" a rua.</p></div><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Compilado por</div><div class="doc-sig-name">Arquivista Sênior Tomas Evrel</div><div class="doc-sig-title">Departamento Histórico do Sínodo</div></div></div><div class="doc-classified-footer">CD-007 · Confidencial · Sínodo do Quinto Véu</div>`},
  {id:'doc03',number:'RI-014 · Inquisidores Arcanos',classif:'confidencial',classifLabel:'Confidencial',title:'Operação Véu Costurado',subtitle:'Desarticulação do Culto do Olho Aberto',desc:'Relatório da operação de dois anos que infiltrou o maior culto dimensional já registrado em Porto Varion.',origin:'Inquisidores Arcanos',date:'Anos 1041–1043 P.V.',password:'olhoaberto',content:`<div class="doc-seal-line">Inquisidores Arcanos · Confidencial · Operações Especiais</div><div class="doc-section-title">Sumário Executivo</div><p class="doc-body-text">Entre 1041 e 1043 P.V., os Inquisidores Arcanos infiltraram o <strong>Culto do Olho Aberto</strong>. A operação resultou em 34 detenções, 6 neutralizações, apreensão de 112 frascos de Resina Etérea e desmantelamento de rede de contrabando dimensional.</p><div class="doc-section-title">A Resina Etérea</div><ul class="doc-list"><li>Amplificação temporária da percepção dimensional em não-treinados.</li><li>Sensação de "contato" com entidades da 5ª Dimensão.</li><li>Dependência psíquica progressiva após três ou mais usos.</li><li>Em doses elevadas: colapso perceptual permanente.</li></ul><div class="doc-callout"><div class="doc-callout-label">Nota do Agente Infiltrado</div><p>"Eles não chamavam de droga. Chamavam de comunhão. Havia de fato uma entidade. Ela não estava oferecendo iluminação."</p></div><div class="doc-warning"><div class="doc-warning-label">⚠ Status Atual</div><p>A entidade <em>Vardhal, o Vidente Eterno</em> não foi eliminada. Foi selada em contenção de Nível 3 no subsolo do Observatório do Véu. Não tente comunicação.</p></div><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Aprovado por</div><div class="doc-sig-name">Legado Carynn Thar</div><div class="doc-sig-title">Comandante de Operações — Inquisidores Arcanos</div></div></div><div class="doc-classified-footer">RI-014 · Confidencial · Sínodo do Quinto Véu</div>`},
  {id:'doc04',number:'CE-002 · Conclave Interno',classif:'maximo-sigilo',classifLabel:'Máximo Sigilo',title:'O Problema Demográfico do Sínodo',subtitle:'Memorando Interno — Sessão Fechada',desc:'Memorando sobre o declínio no número de praticantes qualificados e as implicações políticas desta escassez.',origin:'Conclave Interno',date:'Ano 1044 P.V.',password:'conclave1044',content:`<div class="doc-seal-line">Conclave Interno · Máximo Sigilo · Não Reproduzir</div><div class="doc-warning"><div class="doc-warning-label">⚠ Aviso de Distribuição</div><p>Distribuído exclusivamente aos 14 membros titulares do Conclave. Qualquer cópia não autorizada constitui traição ao Tratado de Vhal'Torin.</p></div><div class="doc-section-title">O Problema</div><p class="doc-body-text">Nos últimos 42 anos, o número de indivíduos com capacidade dimensional suficiente caiu 31%. Nos últimos oito anos, essa queda acelerou para 47% ao ano. O Sínodo entrará em colapso operacional em menos de três décadas.</p><div class="doc-section-title">Hipóteses</div><ul class="doc-list"><li><strong>Hipótese A:</strong> Declínio natural de ciclo longo — sem evidência suficiente.</li><li><strong>Hipótese B:</strong> Supressão genética por perseguição histórica — plausível, não comprovada.</li><li><strong>Hipótese C:</strong> A atividade dimensional crescente está <em>queimando</em> potenciais praticantes — <strong>evidência moderada</strong>.</li><li><strong>Hipótese D:</strong> A 5ª Dimensão está se retraindo voluntariamente — <strong>heresia técnica mencionar publicamente.</strong></li></ul><div class="doc-callout"><div class="doc-callout-label">Magistratus Orin Vel</div><p>"Se a 5ª Dimensão de fato responde à interação humana, então cada uso não autorizado é um passo em direção ao cenário que mais tememos: um mundo sem magia. E nós, sem razão de existir."</p></div><div class="doc-section-title">Decisão</div><p class="doc-body-text">Por onze votos a três: a Hipótese D não será investigada publicamente. Os Agentes de Vínculo continuarão sendo informados de que o declínio é "flutuação demográfica natural".</p><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Ata por</div><div class="doc-sig-name">Dra. Ysara Moln</div><div class="doc-sig-title">Secretária do Conclave</div></div></div><div class="doc-classified-footer">CE-002 · Máximo Sigilo · Sínodo do Quinto Véu</div>`},
  {id:'doc05',number:'PD-033 · Pesquisa Dimensional',classif:'restrito',classifLabel:'Restrito',title:'Classificação de Entidades',subtitle:'Manual de Campo — Edição Revisada',desc:'Manual operacional para identificação e classificação de entidades originárias da 5ª Dimensão.',origin:'Observatório do Véu',date:'Ano 1039 P.V.',password:'entidades',content:`<div class="doc-seal-line">Manual de Campo · Restrito · Observatório do Véu</div><div class="doc-section-title">Classe I — Emanações Passivas</div><p class="doc-body-text">Resíduos dimensionais sem consciência. <em>Impressões</em> da 5ª Dimensão no plano físico. Protocolo: dispersão com selante arcano padrão.</p><div class="doc-section-title">Classe II — Entidades Sencientes Simples</div><p class="doc-body-text">Consciência básica, motivadas por impulsos simples. Frequentemente confundidas com "monstros" pela população.</p><div class="doc-section-title">Classe III — Entidades Sencientes Complexas</div><p class="doc-body-text">Objetivos de longo prazo, capacidade de enganar. Algumas estudaram humanos por décadas antes de qualquer contato.</p><ul class="doc-list"><li>Nunca negociar sem autorização explícita do Conclave.</li><li>Protocolo: contenção de emergência e notificação imediata.</li></ul><div class="doc-section-title">Classe IV — Entidades Arquetípicas</div><p class="doc-body-text">O que a população chama de <em>deuses</em>. O Sínodo reconhece sua existência mas rejeita qualquer conotação divina.</p><div class="doc-warning"><div class="doc-warning-label">⚠ Protocolo Classe IV</div><p>Nenhum agente de campo deve tentar contenção ou comunicação sem autorização direta do Conclave. Retire-se. Registre. Reporte.</p></div><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Revisado por</div><div class="doc-sig-name">Pesquisadora Ilara Dun</div><div class="doc-sig-title">Diretora de Campo — Observatório do Véu</div></div></div><div class="doc-classified-footer">PD-033 · Restrito · Sínodo do Quinto Véu</div>`},
  {id:'doc06',number:'AI-088 · Aurethia — Inteligência',classif:'maximo-sigilo',classifLabel:'Máximo Sigilo',title:'Experimentos Ilegais de Aurethia',subtitle:'Relatório de Infiltração — Câmaras Brancas',desc:'Relatório sobre experimentos com magia ilegal conduzidos pela elite imperial, envolvendo crianças com potencial dimensional.',origin:'Departamento de Inteligência Interna',date:'Ano 1043 P.V.',password:'aurethia43',content:`<div class="doc-seal-line">Inteligência Interna · Máximo Sigilo · Destruir após leitura</div><div class="doc-warning"><div class="doc-warning-label">⚠ Aviso Político</div><p>Este documento contém informações que, se tornadas públicas, precipitariam um conflito de escala continental. Sua existência deve ser negada em todas as circunstâncias.</p></div><div class="doc-section-title">As Câmaras Brancas</div><p class="doc-body-text">Em pelo menos três propriedades nobres de Aurethia, foram identificadas instalações subterrâneas: pesquisa arcana não autorizada em humanos com potencial dimensional não desenvolvido.</p><ul class="doc-list"><li>Entre 40 e 70 indivíduos mantidos simultaneamente.</li><li>Maioria: crianças entre 6 e 14 anos, sequestradas das classes baixas.</li><li>Taxa de sobrevivência: aproximadamente 12%.</li></ul><div class="doc-callout"><div class="doc-callout-label">Nota do Agente</div><p>"São cascas. Ficam parados, os olhos em direções diferentes, murmurando em padrões de Linguagem Dimensional de Classe I. São portais que pensaram que eram pessoas."</p></div><div class="doc-warning"><div class="doc-warning-label">⚠ Decisão do Conclave</div><p>Por sete votos a dois: NÃO confrontar Aurethia neste momento. Os experimentos continuam ocorrendo enquanto este documento é lido.</p></div><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Relatório de</div><div class="doc-sig-name">Agente Codinome: Cinza Pálido</div><div class="doc-sig-title">Identidade Protegida</div></div></div><div class="doc-classified-footer">AI-088 · Máximo Sigilo · Sínodo do Quinto Véu</div>`},
  {id:'doc07',number:"TH-011 · Thal'Myrion",classif:'restrito',classifLabel:'Restrito',title:'O Declínio Élfico',subtitle:"Relatório Diplomático — Missão a Thal'Myrion",desc:'Relatório da única missão diplomática bem-sucedida ao reino élfico, documentando o declínio da raça.',origin:'Departamento de Relações Externas',date:'Ano 1038 P.V.',password:'thalmyrion',content:`<div class="doc-seal-line">Relações Externas · Restrito · Missão Diplomática</div><div class="doc-section-title">Observações</div><p class="doc-body-text">Thal'Myrion é exatamente o que os relatos históricos descrevem: belíssimo, silencioso e profundamente melancólico. E está morrendo.</p><ul class="doc-list"><li>Em três dias de caminhada, encontramos seis elfos.</li><li>Vimos cinco crianças em quarenta e dois dias.</li><li>O Eterno Arkhavel parecia cansado. De um jeito que não é físico.</li></ul><div class="doc-callout"><div class="doc-callout-label">Arkhavel — Trecho</div><p><em>"Nós somos o que acontece quando se olha para a 5ª Dimensão por tempo demais. Ela nos olha de volta. E o olhar muda o que observa."</em></p></div><div class="doc-warning"><div class="doc-warning-label">⚠ Implicação</div><p>Se os élfos — com milênios de tradição — chegaram a este ponto, o que isso diz sobre praticantes humanos com um século de treinamento? O Conclave não respondeu.</p></div><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Delegação</div><div class="doc-sig-name">Mag. Petra Vorn · Dip. Caius Anell · Obs. Sive Rath</div></div></div><div class="doc-classified-footer">TH-011 · Restrito · Sínodo do Quinto Véu</div>`},
  {id:'doc08',number:"VZ-003 · Vhal'Zarak",classif:'maximo-sigilo',classifLabel:'Máximo Sigilo',title:'O Que Há no Nexus Umbral',subtitle:'Relatório da Expedição de 1041',desc:"O único relatório de uma expedição que alcançou o Nexus Umbral e retornou. Dos oito, três sobreviveram.",origin:"Vhal'Zarak — Expedição Especial",date:'Ano 1041 P.V.',password:'nexusumbral',content:`<div class="doc-seal-line">Vhal'Zarak · Máximo Sigilo · Acesso Especial</div><div class="doc-warning"><div class="doc-warning-label">⚠ Aviso</div><p>Leitores com histórico de instabilidade perceptual não devem ler este documento sem supervisão clínica.</p></div><div class="doc-section-title">O Nexus Umbral</div><p class="doc-body-text">Chegamos ao Nexus no décimo dia. Não é um lugar no sentido convencional — é um ponto onde o conceito de <em>lugar</em> foi danificado além do reparo.</p><div class="doc-callout"><div class="doc-callout-label">Magister Aldric Yuno (sobrevivente)</div><p>"No centro, havia algo. Não vou chamar de criatura porque isso implica forma, e forma implica limite. Havia... presença. Ela sabia que estávamos lá há muito tempo antes de chegarmos. E estava esperando. Não com paciência. Com certeza."</p></div><div class="doc-section-title">Os Cinco Que Não Voltaram</div><p class="doc-body-text">Não foram atacados. Caminharam em direção ao centro. Um por um. Como se tivessem lembrado de um compromisso esquecido.</p><div class="doc-warning"><div class="doc-warning-label">⚠ Recomendação</div><p>Nenhuma expedição adicional deve ser autorizada. O perigo não é a morte. É a incorporação.</p></div><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Sobreviventes</div><div class="doc-sig-name">Aldric Yuno · Pren Vael · Sonia Marsh</div></div></div><div class="doc-classified-footer">VZ-003 · Máximo Sigilo · Sínodo do Quinto Véu</div>`},
  {id:'doc09',number:'IG-019 · Relações com a Igreja',classif:'confidencial',classifLabel:'Confidencial',title:'A Profecia do Selador',subtitle:'Análise das Versões Divergentes',desc:'Análise das quatro versões conhecidas da profecia sobre "aquele que selará o Quinto Véu".',origin:'Departamento de Relações com a Igreja',date:'Ano 1040 P.V.',password:'selador7',content:`<div class="doc-seal-line">Relações com a Igreja · Confidencial · Análise Teológica</div><div class="doc-section-title">Versão I — Texto Canônico</div><div class="doc-callout"><div class="doc-callout-label">Texto</div><p>"Virá aquele que, nascido sob o signo do Sétimo Véu, selará a passagem entre o mundo dos vivos e a dimensão proibida."</p></div><div class="doc-section-title">Versão II — Manuscrito de Lux Aeterna</div><div class="doc-callout"><div class="doc-callout-label">Texto</div><p>"...selará a passagem — <em>não pelo poder, mas pela ausência dele</em>. E o fechamento não será vitória. Será luto."</p></div><div class="doc-section-title">Versão III — Fragmento de Aethryon</div><div class="doc-callout"><div class="doc-callout-label">Texto (parcialmente ilegível)</div><p>"...virá de fora das casas de saber... [ilegível] ... não reconhecido pelos guardiões..."</p></div><div class="doc-section-title">Versão IV — Documento Proibido</div><div class="doc-warning"><div class="doc-warning-label">⚠ Nota</div><p>Esta versão foi suprimida pela hierarquia da Igreja. Sua autenticidade é contestada.</p></div><div class="doc-callout"><div class="doc-callout-label">Texto</div><p>"O Selador não fechará o Quinto Véu porque é justo. Fechará porque não terá escolha. E quando o véu se fechar, aquilo que está do outro lado ficará conosco — porque já terá cruzado."</p></div><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Análise por</div><div class="doc-sig-name">Dra. Corin Vael</div></div></div><div class="doc-classified-footer">IG-019 · Confidencial · Sínodo do Quinto Véu</div>`},
  {id:'doc10',number:"KD-005 · Khar'Duran",classif:'restrito',classifLabel:'Restrito',title:'A Muralha Está Cedendo',subtitle:"Avaliação Militar — Khar'Duran",desc:"Avaliação militar sobre a real capacidade da Grande Muralha de Duran-Khal de conter as emanações de Vhal'Zarak.",origin:"Ligação Militar — Khar'Duran",date:'Ano 1044 P.V.',password:'muralha44',content:`<div class="doc-seal-line">Khar'Duran · Ligação Militar · Restrito</div><div class="doc-section-title">Estado Atual</div><ul class="doc-list"><li>Extensão total: 847 km. Guarnecida em 94%.</li><li>Seções com comprometimento estrutural: 31%.</li><li>Seções com <em>comprometimento dimensional</em>: <strong>8%</strong>.</li><li>Estimativa de vida útil sem reparo: 15 a 40 anos.</li></ul><div class="doc-section-title">O Problema dos Recursos</div><ul class="doc-list"><li>Aurethia atrasou pagamentos pelo quinto ano consecutivo.</li><li>Liga Mercante enviou 60% do compromisso.</li><li>Domínio da Igreja enviou orações e dois capelões.</li><li>Thal'Myrion não responde há três anos.</li></ul><div class="doc-callout"><div class="doc-callout-label">General Rath Durak</div><p>"Quando a Muralha cair — e ela vai cair, se nada mudar — o mundo vai perguntar por que não avisamos. Estamos avisando. Ninguém está ouvindo."</p></div><div class="doc-warning"><div class="doc-warning-label">⚠ Pedido Formal</div><p>Sem a Muralha, toda a região entre Khar'Duran e Porto Varion seria classificada como Zona de Realidade Instável em menos de cinco anos.</p></div><div class="doc-divider">· · ✦ · ·</div><div class="doc-signature-block"><div><div class="doc-sig">Assinado pelo</div><div class="doc-sig-name">Conselho da Triarquia de Khar'Duran</div></div></div><div class="doc-classified-footer">KD-005 · Restrito · Sínodo do Quinto Véu</div>`}
];

if(document.getElementById('docs-grid')){
  const grid=document.getElementById('docs-grid');grid.innerHTML='';
  DOCS.forEach(doc=>{
    const card=document.createElement('div');card.className='doc-card';
    card.innerHTML=`<div class="doc-card-header"><div class="doc-classif-tag ${doc.classif}">${doc.classifLabel}</div><div class="doc-number">${doc.number}</div><div class="doc-title">${doc.title}</div><div class="doc-subtitle">${doc.subtitle}</div></div><div class="doc-card-body"><p class="doc-desc">${doc.desc}</p><div class="doc-meta-row"><div class="doc-meta">Origem: <span>${doc.origin}</span></div><div class="doc-meta">Data: <span>${doc.date}</span></div></div><div class="doc-locked-bar"><span class="doc-lock-icon">🔒</span><span class="doc-lock-hint">Acesso protegido por código</span><button class="doc-access-btn" onclick="openDocPwd('${doc.id}')">Acessar</button></div></div>`;
    grid.appendChild(card);
  });
}

function handlePwdSubmit() {
  if (pendingBlockId) confirmUnlock();
  else if (currentDocId) {
    if (window.isGlossaryPwd) window.confirmPwd(); 
    else confirmDocPwd();
  }
}

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
// LORE CENSURADA
// ══════════════════════════════════════════
function unlockCensored(blockId, password, title) {
  pendingBlockId = blockId; pendingPassword = password; currentDocId = null;
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
const BEASTS=[
  {name:'Goblin',icon:'👺',type:'Humanoide Pequeno',rarity:'comum',cr:'1/4',hp:'7',ac:'15',speed:'30ft',desc:'Criaturas ágeis que vivem em grupos nos esgotos e ruínas de Porto Varion. Ladrões oportunistas.',lore:'Chamados de "filhos do lixo" pelos moradores da Baixa Varion. Já foram vistos roubando selantes arcanos.'},
  {name:'Esqueleto',icon:'💀',type:'Morto-vivo Médio',rarity:'comum',cr:'1/4',hp:'13',ac:'13',speed:'30ft',desc:'Restos animados por magia residual. Surgem com mais frequência próximos às áreas de fratura dimensional.',lore:'Diferente do folclore, esqueletos não precisam de necromante. Basta energia dimensional suficiente.'},
  {name:'Zumbi',icon:'🧟',type:'Morto-vivo Médio',rarity:'comum',cr:'1/4',hp:'22',ac:'8',speed:'20ft',desc:'Lentos mas resistentes. Sinal claro de uso ilegal de magia recente na área.',lore:'Aviste um zumbi, relate ao Supervisor. Onde há um, há uma fonte próxima.'},
  {name:'Lobo',icon:'🐺',type:'Besta Média',rarity:'comum',cr:'1/4',hp:'11',ac:'13',speed:'40ft',desc:'Predadores naturais, mas tocados pela 5ª Dimensão tornam-se imprevisíveis. Olhos pálidos quando corrompidos.',lore:'Alcateias inteiras registradas na rota da ferrovia da Liga Mercante.'},
  {name:'Kobold',icon:'🦎',type:'Humanoide Pequeno',rarity:'comum',cr:'1/8',hp:'5',ac:'12',speed:'30ft',desc:'Engenhosos e covardes em grupo. Armadilhas improvisadas e táticas de enxame.',lore:'Um grupo foi encontrado no porto usando aparelhos de medição roubados do Sínodo.'},
  {name:'Bandido',icon:'🗡️',type:'Humanoide Médio',rarity:'comum',cr:'1/8',hp:'11',ac:'12',speed:'30ft',desc:'Criminosos organizados da Baixa Varion. Muitos trabalham para redes de contrabando de Resina Etérea.',lore:'A guilda dos "Véus Rasgados" recruta ex-agentes de vínculo decepcionados.'},
  {name:'Rato Gigante',icon:'🐀',type:'Besta Pequena',rarity:'comum',cr:'1/8',hp:'7',ac:'12',speed:'30ft',desc:'Infestam os esgotos e armazéns do porto. Tamanho do torso de um adulto.',lore:'Os ratos do Bairro do Véu: alguns nascem com duas caudas e olhos que refletem luz que não existe.'},
  {name:'Cultista',icon:'🕯️',type:'Humanoide Médio',rarity:'comum',cr:'1/8',hp:'9',ac:'12',speed:'30ft',desc:'Seguidores fanatizados de entidades dimensionais. Perigosos em grupos com acesso a rituais básicos.',lore:'Pós-Operação Véu Costurado, novos grupos surgem. Usam diferentes símbolos mas parecem coordenados.'},
  {name:'Guarda',icon:'🛡️',type:'Humanoide Médio',rarity:'comum',cr:'1/8',hp:'11',ac:'16',speed:'30ft',desc:'Guardas de corporações, nobres e do próprio Sínodo. Leais a quem paga.',lore:'Após o incidente do Mercado Livre, o Sínodo triplicou os guardas no Cais das Nações.'},
  {name:'Gnoll',icon:'🐗',type:'Humanoide Médio',rarity:'comum',cr:'1/2',hp:'22',ac:'15',speed:'30ft',desc:'Predadores de aspecto canino. Violentos e imprevisíveis.',lore:'Um bando foi capturado no porto carregando caixotes com símbolo de casa nobre de Aurethia.'},
  {name:'Hobgoblin',icon:'⚔️',type:'Humanoide Médio',rarity:'comum',cr:'1/2',hp:'11',ac:'18',speed:'30ft',desc:'Militaristas disciplinados. Formam companhias mercenárias bem organizadas.',lore:'A Companhia da Lanterna Fria está contratada pela Liga Mercante como escolta portuária.'},
  {name:'Bugbear',icon:'🐻',type:'Humanoide Grande',rarity:'comum',cr:'1',hp:'27',ac:'16',speed:'40ft',desc:'Grandes, furtivos e brutais. Capazes de passar despercebidos até o momento do ataque.',lore:'Um bugbear chamado Harsk trabalha como carregador no Cais. Honesto, mas irritável.'},
  {name:'Ogre',icon:'👹',type:'Gigante Grande',rarity:'incomum',cr:'2',hp:'59',ac:'11',speed:'40ft',desc:'Força bruta descomunal. Perigosos em espaços fechados.',lore:'Dois ogros foram recrutados como seguranças de um carregamento misterioso do porto norte.'},
  {name:'Serpente Dimensional',icon:'🐍',type:'Monstrosity Média',rarity:'incomum',cr:'2',hp:'32',ac:'13',speed:'30ft',desc:'Corpo de serpente translúcido com swirls dimensionais pulsando dentro. Pode atravessar paredes uma vez por dia.',lore:'Originária das fissuras do Bairro do Véu. Classe I ou II ainda em debate.'},
  {name:'Sombra Dimensional',icon:'🌑',type:'Não-morto Médio',rarity:'incomum',cr:'3',hp:'16',ac:'12',speed:'40ft',desc:'Criatura feita da sombra de alguém que morreu em zona de fratura. Drena força física ao toque.',lore:'Identificada em Aethryon. Agora aparecem no Bairro do Véu. Luz solar as desfaz.'},
  {name:'Basilisco',icon:'🦎',type:'Monstrosity Média',rarity:'incomum',cr:'3',hp:'52',ac:'15',speed:'20ft',desc:'Réptil com oito patas e olhar petrificante. Muito territorial.',lore:'Vive nas galerias de esgoto sob o Distrito Acadêmico. Ninguém quer entrar para removê-lo.'},
  {name:'Harpia',icon:'🦅',type:'Monstrosity Média',rarity:'incomum',cr:'1',hp:'38',ac:'11',speed:'20ft',desc:'Corpo humanoide com asas. Canto hipnótico que atrai vítimas.',lore:'Três harpias nidificam nas chaminés do estaleiro velho. Marinheiros as alimentam por "sorte".'},
  {name:'Eco de Aethryon',icon:'👤',type:'Aberração Média',rarity:'raro',cr:'5',hp:'67',ac:'14',speed:'30ft',desc:'Entidade formada por loop temporal residual de Aethryon. Parece humano mas repete os últimos momentos de sua vida.',lore:'CLASSE II-III. Pode ter surgido de um sobrevivente de Aethryon em colapso perceptual total.'},
  {name:'Guardião do Véu',icon:'🌀',type:'Construto Grande',rarity:'raro',cr:'8',hp:'142',ac:'17',speed:'30ft',desc:'Construto dos primeiros membros do Sínodo. Armadura de pedra com núcleo de energia da 5ª Dimensão.',lore:'Existem três no subsolo do Alto Sínodo. O terceiro não responde há 40 anos. Ninguém vai verificar.'},
  {name:'Fragmento de Vardhal',icon:'👁️',type:'Aberração Grande',rarity:'raro',cr:'9',hp:'178',ac:'16',speed:'0ft',desc:'Fragmento de Vardhal, o Vidente Eterno. Altamente inteligente, manipulador, lê memórias pelo contato visual.',lore:'AVISO MÁXIMO: Se o selo de contenção do Observatório for comprometido, este fragmento pode ser liberado.'}
];

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
renderBeasts();
function setBeastFilter(f,btn){
  currentBeastFilter=f; document.querySelectorAll('.bestiary-filter').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  renderBeasts(f,document.querySelector('.bestiary-search').value);
}
function filterBeasts(v){renderBeasts(currentBeastFilter,v);}

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

// ══════════════════════════════════════════
// GLOSSÁRIO
// ══════════════════════════════════════════
const GLOSSARY = [
  {id: 'lore01', term: 'O Quinto Véu', category: 'Dimensão', desc: 'A camada da realidade adjacente ao plano físico. É de onde a magia emana e onde o Tratado de Vhal\'Torin mantém vigilância constante.', restricted: false},
  {id: 'lore02', term: 'Tratado de Vhal\'Torin', category: 'História', desc: 'O acordo global que encerrou a Guerra do Véu, proibindo o uso livre da magia e estabelecendo o Sínodo como órgão regulador.', restricted: false},
  {id: 'lore03', term: 'Resina Etérea', category: 'Substância', desc: 'Líquido roxo pulsante que amplia a percepção dimensional em não-treinados. Altamente viciante e perigoso.', restricted: false},
  {id: 'lore04', term: 'A Cicatriz de Vhal\'Zarak', category: 'Localização', desc: 'Ponto onde a realidade foi permanentemente rasgada durante o colapso dimensional. É considerada uma Zona de Realidade Instável sob vigilância da Muralha Norte.', restricted: true, password: 'cicatrizaberta'},
  {id: 'lore05', term: 'Investigador de Véu', category: 'Patente', desc: 'Nível avançado de autoridade conferido a Agentes de Vínculo que demonstraram lealdade e capacidade. Utilizam insígnias de bronze com o ponto central de 7 raios.', restricted: true, password: 'bronze7'}
];

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

document.addEventListener('DOMContentLoaded', () => { 
  if(document.getElementById('glossary-grid')) renderGlossary(); 
});
</script>