/* Modulo «Promuoviti con noi»: schede, pacchetti, totale, invio al backend (Apps Script). */
(function(){
  const PAGINE=[
    {id:'calabresi', nome:'I Calabresi', follower:'371.000 follower', prezzo:150, logo:'i-calabresi-monogramma.png'},
    {id:'pugliesi',  nome:'I Pugliesi',  follower:'149.000 follower', prezzo:120, logo:'i-pugliesi-monogramma.png'},
    {id:'veneti',    nome:'I Veneti',    follower:'148.000 follower', prezzo:100, logo:'i-veneti-monogramma.png'},
    {id:'napoletani',nome:'I Napoletani',follower:'99.000 follower',  prezzo:100, logo:'i-napoletani-monogramma.png'},
    {id:'romani',    nome:'I Romani',    follower:'145.000 follower', prezzo:80,  logo:'i-romani-monogramma.png'},
    {id:'milanesi',  nome:'Imilanesi',   follower:'89.000 follower',  prezzo:80,  logo:'i-milanesi-monogramma.png'},
    {id:'siciliani', nome:'I Siciliani', follower:'46.000 follower',  prezzo:50,  logo:'i-siciliani-monogramma.png'},
    {id:'winepost',  nome:'The Wine Post',follower:'49.000 follower · solo Facebook', prezzo:50, logo:'the-wine-post-monogramma.png'}
  ];
  const PACCHETTI=[
    {id:'nessuno', nome:'Nessuno', lista:'Scelgo io le pagine qui sopra', prezzo:0, listino:0},
    {id:'sud', nome:'Sud', lista:'Calabresi, Pugliesi, Napoletani, Siciliani', prezzo:350, listino:420},
    {id:'centro-nord', nome:'Centro e Nord', lista:'Romani, Veneti, Imilanesi', prezzo:220, listino:260},
    {id:'italia', nome:'Tutta Italia', lista:'Le sette pagine regionali', prezzo:550, listino:680},
    {id:'totale', nome:'Copertura totale', lista:'Tutte e otto le pagine, più una seconda uscita a 7 giorni', prezzo:950, listino:1460}
  ];
  const GRAFICA=[
    {id:'mia', titolo:"Ce l'ho già", desc:'Mando io la foto o la grafica, nel formato che preferisco.', tag:'Inclusa', prezzo:0},
    {id:'voi', titolo:'La create voi', desc:'Prepariamo noi la grafica nello stile della pagina, con una bozza da approvare.', tag:'+ € 50', prezzo:50}
  ];
  const eur=n=>'€ '+n.toLocaleString('it-IT');
  const $=s=>document.querySelector(s);

  function card(type,name,value,inner,checked){
    const l=document.createElement('label'); l.className='card'+(checked?' on':'');
    l.innerHTML=`<input type="${type}" name="${name}" value="${value}" ${checked?'checked':''}><span class="tick"></span>${inner}`;
    return l;
  }
  const pg=$('#pagine');
  PAGINE.forEach(p=>pg.appendChild(card('checkbox','pagine',p.id,
    `<img class="logo" src="loghi/${p.logo}" alt=""><span class="pg-name">${p.nome}</span><span class="pg-meta">${p.follower}</span><span class="pg-price">${eur(p.prezzo)} / post</span>`)));
  const pk=$('#pacchetti');
  PACCHETTI.forEach((p,i)=>pk.appendChild(card('radio','pacchetto',p.id,
    `<span class="pg-name">${p.nome}</span><span class="pack-list">${p.lista}</span>`+
    (p.prezzo?`<span class="pack-price"><b>${eur(p.prezzo)}</b><s>${eur(p.listino)}</s></span><span class="save">Risparmi ${eur(p.listino-p.prezzo)}</span>`:''),i===0)));
  const gr=$('#grafica');
  GRAFICA.forEach((g,i)=>gr.appendChild(card('radio','grafica',g.id,
    `<span class="ch-title">${g.titolo}</span><span class="ch-desc">${g.desc}</span><span class="ch-tag">${g.tag}</span>`,i===0)));

  function sync(){
    document.querySelectorAll('.card').forEach(c=>c.classList.toggle('on',c.querySelector('input').checked));
    const pacc=PACCHETTI.find(p=>p.id===$('input[name=pacchetto]:checked').value);
    const scelte=[...document.querySelectorAll('input[name=pagine]:checked')].map(i=>PAGINE.find(p=>p.id===i.value));
    const graf=GRAFICA.find(g=>g.id===$('input[name=grafica]:checked').value);
    let tot=pacc.prezzo||scelte.reduce((s,p)=>s+p.prezzo,0);
    tot+=graf.prezzo;
    $('#rc-pagine').textContent=pacc.prezzo?pacc.lista:(scelte.length?scelte.map(p=>p.nome).join(', '):'Nessuna pagina scelta');
    $('#rc-pacchetto').textContent=pacc.prezzo?pacc.nome:'Nessuno';
    $('#rc-grafica').textContent=graf.prezzo?'La create voi (+ € 50)':'La mando io';
    $('#rc-totale').textContent=eur(tot);
    $('#upload-wrap').hidden=graf.prezzo>0;
    $('#fattura-campi').hidden=!$('#fattura').checked;
    return {pacc,scelte,graf,tot};
  }
  pg.addEventListener('change',()=>{ if([...pg.querySelectorAll('input:checked')].length) $('input[name=pacchetto][value=nessuno]').checked=true; sync(); });
  pk.addEventListener('change',e=>{ if(e.target.value!=='nessuno') pg.querySelectorAll('input').forEach(i=>i.checked=false); sync(); });
  gr.addEventListener('change',sync); $('#fattura').addEventListener('change',sync);
  sync();

  const msg=$('#msg');
  function show(t,cls){ msg.textContent=t; msg.className='msg '+cls; msg.hidden=false; msg.scrollIntoView({block:'nearest',behavior:'smooth'}); }

  function readFile(f){ return new Promise((ok,ko)=>{ const r=new FileReader(); r.onload=()=>ok(r.result.split(',')[1]); r.onerror=ko; r.readAsDataURL(f); }); }

  $('#modulo').addEventListener('submit',async e=>{
    e.preventDefault();
    const st=sync(); const form=e.target;
    let bad=[...form.querySelectorAll('[required]')].filter(i=>i.type==='checkbox'?!i.checked:!i.value.trim());
    form.querySelectorAll('.invalid').forEach(i=>i.classList.remove('invalid'));
    if(!st.pacc.prezzo && !st.scelte.length){ show('Scegli almeno una pagina o un pacchetto.','err'); pg.scrollIntoView({behavior:'smooth'}); return; }
    if(bad.length){ bad.forEach(i=>i.classList.add('invalid')); bad[0].focus(); show('Mancano alcuni campi obbligatori (segnati con *).','err'); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('#email').value)){ $('#email').classList.add('invalid'); show('Controlla l\'indirizzo email.','err'); return; }
    const file=$('#immagine').files[0]; let allegato=null;
    if(file && !$('#upload-wrap').hidden){
      if(file.size>8*1024*1024){ show('L\'immagine supera 8 MB: riducila o mandacela dopo per email.','err'); return; }
      allegato={nome:file.name,tipo:file.type,base64:await readFile(file)};
    }
    const dati={
      inviato:new Date().toISOString(), pagina:location.href,
      pagine:st.pacc.prezzo?[]:st.scelte.map(p=>p.nome), pacchetto:st.pacc.prezzo?st.pacc.nome:'',
      grafica:st.graf.titolo, totale:st.tot,
      attivita:$('#attivita').value.trim(), sito:$('#sito').value.trim(), descrizione:$('#descrizione').value.trim(),
      nome:$('#nome').value.trim(), cognome:$('#cognome').value.trim(), email:$('#email').value.trim(), telefono:$('#telefono').value.trim(), canale:$('#canale').value,
      fattura:$('#fattura').checked, ragione_sociale:$('#ragione_sociale').value.trim(), piva:$('#piva').value.trim(), codice_fiscale:$('#codice_fiscale').value.trim(), sdi:$('#sdi').value.trim(), indirizzo:$('#indirizzo').value.trim(),
      allegato
    };
    const btn=$('#invia'); btn.disabled=true; btn.textContent='Invio in corso…';
    try{
      if(!window.CONFIG || !CONFIG.endpoint){ throw new Error('anteprima'); }
      const r=await fetch(CONFIG.endpoint,{method:'POST',body:JSON.stringify(dati),headers:{'Content-Type':'text/plain;charset=utf-8'}});
      const j=await r.json(); if(!j.ok) throw new Error(j.errore||'risposta non valida');
      form.reset(); sync();
      show('Richiesta inviata. Ti rispondiamo di solito entro due giorni lavorativi all\'indirizzo che hai indicato.','ok');
      btn.textContent='Richiesta inviata';
    }catch(err){
      if(err.message==='anteprima') show('Questa è un\'anteprima: il modulo non è ancora collegato. Nella versione online la richiesta arriva alla redazione.','err');
      else show('Non siamo riusciti a inviare la richiesta. Riprova tra un minuto oppure scrivici a '+((window.CONFIG&&CONFIG.email)||'prositagency@gmail.com')+'.','err');
      btn.disabled=false; btn.textContent='Invia la richiesta';
    }
  });
})();
