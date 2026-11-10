const RO={PLK:['PLK','PYM','KSO','KRI','PPS','KKP','KKN'],MTW:['MTW','BNT','AMP','PRC','TML']};
const roOf=s=>RO.PLK.includes(s)?'PLK':RO.MTW.includes(s)?'MTW':'-';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwRlTEJPDHuUSXTGuqCAMTPnhKzJHdOAuAJM0RhQ2F6EqGW8sn1RWg3PuMaj8VMQP8/exec';

let D=[],ST={},sel=null;
let displayLimit = 150;
const $=id=>document.getElementById(id);
try{ST=JSON.parse(localStorage.getItem('odc-st-v4')||'{}')}catch(e){ST={}}
const save=()=>{try{localStorage.setItem('odc-st-v4',JSON.stringify(ST))}catch(e){}};

async function loadDataFromSheet(){
 if(!APPS_SCRIPT_URL){loadSample();return;}
 try{
  $('src').textContent='Memuat data dari Google Sheets...';
  const res = await fetch(APPS_SCRIPT_URL);
  const json = await res.json();
  if(Array.isArray(json) && json.length > 0){
   D = json.map(r=>{
    const num = s=>parseFloat(String(s||'').replace('°','').replace(',','.'));
    return {
     odc: String(r['odc']||'').trim(),
     sto: String(r['sto']||'').trim().toUpperCase(),
     alamat: String(r['alamat']||'').trim(),
     namaPemilik: String(r['nama pemilik']||r['pemilik']||r['pic']||'').trim(),
     tipe: String(r['type odc']||r['tipe']||'').replace('ODC-','').trim(),
     kap: String(r['kapasitas']||r['kap']||'').trim(),
     lat: num(r['latitude']||r['lat']),
     lon: num(r['longitude']||r['lon']),
     was: /^SUDAH/i.test(String(r['sabuk odc (wasaka)']||r['wasaka']||'')),
     linkGov: String(r['izin pemerintah']||r['linkgov']||r['link_gov']||'').trim(),
     linkCom: String(r['izin masyarakat']||r['linkcom']||r['link_com']||'').trim(),
     linkSitac: String(r['sitac']||r['linksitac']||r['link_sitac']||'').trim(),
     expSitac: String(r['masa berlaku sitac']||r['expsitac']||r['exp']||'').trim().slice(0,10),
     linkPay: String(r['kwitansi pembayaran']||r['linkpay']||r['link_pay']||'').trim(),
     fotoDalam: String(r['foto odc dalam']||'').trim(),
     fotoLuar: String(r['foto odc luar']||'').trim(),
     tipeBiaya: String(r['tipe biaya']||r['kategori biaya']||r['biaya']||'OTC').trim().toUpperCase()
    };
   }).filter(o=>o.odc);
   $('src').textContent='Sinkron dari Google Sheets ('+D.length+' ODC)';
   setupSto();refresh();
  } else {loadSample();}
 }catch(e){loadSample();}
}

function loadSample(){
 D=[{odc:'ODC-AMP-FA',sto:'AMP',alamat:'JL. AMPAH - TAMIANG',namaPemilik:'Bapak H. Ahmad',tipe:'C',kap:'288',lat:-1.800405,lon:115.149710,was:false,linkGov:'https://drive.google.com/sample',linkCom:'https://drive.google.com/sample',linkSitac:'https://drive.google.com/sample',expSitac:'2027-01-20',linkPay:'https://drive.google.com/sample',tipeBiaya:'RECURRING'}];
 $('src').textContent='Sampel Data';
 setupSto();refresh();
}

function g(o){
 const s=ST[o.odc]||{};
 return {
  namaPemilik: s.namaPemilik ?? o.namaPemilik ?? '',
  linkGov: s.linkGov ?? o.linkGov ?? '',
  linkCom: s.linkCom ?? o.linkCom ?? '',
  linkSitac: s.linkSitac ?? o.linkSitac ?? '',
  expSitac: s.expSitac ?? o.expSitac ?? '',
  linkPay: s.linkPay ?? o.linkPay ?? '',
  fotoDalam: s.fotoDalam ?? o.fotoDalam ?? '',
  fotoLuar: s.fotoLuar ?? o.fotoLuar ?? '',
  tipeBiaya: s.tipeBiaya ?? o.tipeBiaya ?? 'OTC'
 };
}

function countDocs(o){ const x=g(o); return (x.linkGov?1:0)+(x.linkCom?1:0)+(x.linkSitac?1:0)+(x.linkPay?1:0); }
function getPct(o){return (countDocs(o)/4)*100;}
function expSoon(o){ const x=g(o); if(!x.expSitac)return false; return (new Date(x.expSitac)-Date.now())/864e5<=90; }

function getStatusInfo(o){
 const x = g(o);
 const p = getPct(o);
 if(p === 100) return { color: '#18864b', label: 'Paripurna (100% - Hijau Tua)' };
 if(x.linkSitac && x.linkGov) return { color: '#22c55e', label: 'SITAC & Pemda (Hijau Standar)' };
 if(x.linkSitac) return { color: '#86efac', label: 'SITAC Saja (Hijau Muda)' };
 if(p > 0) return { color: '#b87400', label: 'Sebagian' };
 return { color: '#c62f3a', label: 'Belum Ada' };
}

function getRecurringCategory(o) {
 const x = g(o);
 if(x.tipeBiaya !== 'RECURRING' || !x.expSitac) return null;
 const daysLeft = (new Date(x.expSitac) - Date.now()) / 864e5;
 if(daysLeft <= 90) return '3bulan';
 if(daysLeft <= 365) return '1tahun';
 return 'lebih1tahun';
}

const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
const map = L.map('map', { center: [-1.6, 114.0], zoom: 7, layers: [satLayer] });
L.control.layers({ "Peta Jalan": osmLayer, "Satelit": satLayer }).addTo(map);
const markersLayer = L.layerGroup().addTo(map);

function fil(){
 const r=$('fro').value, s=$('fsto').value, t=$('fst').value, q=$('q').value.toLowerCase();
 return D.filter(o=>{
  const x=g(o), p=getPct(o);
  const recCat = getRecurringCategory(o);
  
  if(t === 'rec3m' && recCat !== '3bulan') return false;
  if(t === 'rec1y' && recCat !== '1tahun') return false;
  if(t === 'rec>1y' && recCat !== 'lebih1tahun') return false;
  if(t === 'ok' && p !== 100) return false;
  if(t === 'sitac_gov' && !(x.linkSitac && x.linkGov)) return false;
  if(t === 'sitac_only' && !(x.linkSitac && !x.linkGov && !x.linkCom && !x.linkPay)) return false;

  return (!r||roOf(o.sto)===r)&&(!s||o.sto===s)&&(!q||(o.odc+o.alamat+x.namaPemilik).toLowerCase().includes(q))&&
  (!t||t.startsWith('rec')||t==='ok'||t==='sitac_gov'||t==='sitac_only'||(t==='none'?p===0:expSoon(o)))
 });
}

function kpis(){
 const n=D.length||1;
 const ok=D.filter(o=>getPct(o)===100).length;
 const sitacGov=D.filter(o=>{const x=g(o); return x.linkSitac && x.linkGov && getPct(o)!==100;}).length;
 const sitacOnly=D.filter(o=>{const x=g(o); return x.linkSitac && !x.linkGov;}).length;
 const none=D.filter(o=>getPct(o)===0).length;
 const ex=D.filter(expSoon).length;
 const w=D.filter(o=>o.was).length;

 const rec3M = D.filter(o=>getRecurringCategory(o)==='3bulan').length;
 const rec1Y = D.filter(o=>getRecurringCategory(o)==='1tahun').length;

 const k=(v,l,c)=>`<div class="k ${c||''}"><b>${v}</b><span>${l}</span></div>`;
 $('kpis').innerHTML=k(D.length,'Total ODC')
  +k(ok,'Paripurna (Hijau Tua)','g')
  +k(sitacGov,'SITAC & Pemda (Hijau Std)','a')
  +k(sitacOnly,'SITAC Saja (Hijau Muda)','a')
  +k(none,'Belum Ada Berkas','r')
  +k(ex,'Masa Berlaku Sitac ≤ 90 Hari','a')
  +k(Math.round(w/n*100)+'%','Sudah WASAKA ('+w+')','g')
  +k(rec3M,'Recurring Sisa ≤ 3 Bulan','r')
  +k(rec1Y,'Recurring Sisa ≤ 1 Tahun','a');
}

function stoPanel(){
 let h='';
 for(const r of['PLK','MTW']){
  h+=`<div class="ro">RO ${r}</div>`;
  for(const s of RO[r]){
   const a=D.filter(o=>o.sto===s),n=a.length;
   const ok=a.filter(o=>getPct(o)===100).length;
   const sitGov=a.filter(o=>{const x=g(o); return x.linkSitac && x.linkGov && getPct(o)!==100;}).length;
   const sitOnly=a.filter(o=>{const x=g(o); return x.linkSitac && !x.linkGov;}).length;
   const no=n-ok-sitGov-sitOnly;
   const p=v=>n?v/n*100:0;
   
   h+=`<div class="sto" onclick="filterBySto('${s}')" style="cursor:pointer; padding:3px 4px; border-radius:4px;" title="Klik untuk filter STO ${s}">
    <span><b>${s}</b></span>
    <div class="sb" title="${ok} paripurna, ${sitGov} sitac+gov, ${sitOnly} sitac saja, ${no} lainnya">
     <i style="width:${p(ok)}%;background:#18864b"></i>
     <i style="width:${p(sitGov)}%;background:#22c55e"></i>
     <i style="width:${p(sitOnly)}%;background:#86efac"></i>
     <i style="width:${p(no)}%;background:var(--red)"></i>
    </div>
    <span>${n?ok+'/'+n:'–'}</span>
   </div>`;
  }
 }
 $('sto').innerHTML=h;
}

function filterBySto(stoName) {
 $('fsto').value = stoName;
 displayLimit = 150;
 refresh();
}

function table(){
 const a=fil();
 $('cnt').textContent=a.length+' dari '+D.length+' ODC';
 
 const sliced = a.slice(0, displayLimit);
 
 let html = sliced.length ? sliced.map(o=>{
  const x=g(o), id=o.odc;
  const stInfo = getStatusInfo(o);
  const isRec = x.tipeBiaya === 'RECURRING';
  
  return `<tr data-id="${E(id)}" class="${sel===id?'sel':''}" style="cursor:pointer;" title="Klik untuk kelola dokumen & foto">
   <td><b>${E(id)}</b></td>
   <td>${E(o.sto)}</td>
   <td>${E(o.alamat)}</td>
   <td>${E(x.namaPemilik || '-')}</td>
   <td><span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${isRec?'var(--amb)':'var(--acc)'};color:#fff;font-weight:600;">${E(x.tipeBiaya)}</span></td>
   <td>${o.was?'Sudah':'Belum'}</td>
   <td>${x.linkGov ? '<a style="color:var(--grn);font-weight:600;" href="'+E(x.linkGov)+'" target="_blank">✓ Ada</a>' : '<span style="color:var(--mut)">Belum</span>'}</td>
   <td>${x.linkCom ? '<a style="color:var(--grn);font-weight:600;" href="'+E(x.linkCom)+'" target="_blank">✓ Ada</a>' : '<span style="color:var(--mut)">Belum</span>'}</td>
   <td>${x.linkSitac ? '<a style="color:var(--grn);font-weight:600;" href="'+E(x.linkSitac)+'" target="_blank">✓ Ada</a>' : '<span style="color:var(--mut)">Belum</span>'} ${x.expSitac?'<br><small style="color:'+(expSoon(o)?'var(--red)':'var(--mut)')+'">('+(isRec?'🔄 ':'')+E(x.expSitac)+')</small>':''}</td>
   <td>${x.linkPay ? '<a style="color:var(--grn);font-weight:600;" href="'+E(x.linkPay)+'" target="_blank">✓ Ada</a>' : '<span style="color:var(--mut)">Belum</span>'}</td>
   <td><span class="pill" style="background:${stInfo.color};color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;">${stInfo.label}</span></td>
  </tr>`;
 }).join('') : '<tr><td colspan="11" class="empty">Tidak ada ODC yang cocok.</td></tr>';

 if(a.length > displayLimit) {
  html += `<tr><td colspan="11" style="text-align:center;padding:10px;"><button id="load-more-btn" style="padding:6px 16px;font-weight:600;">Muat Lebih Banyak (${a.length - displayLimit} tersisa)...</button></td></tr>`;
 }

 $('tb').innerHTML = html;
 
 const btnMore = $('load-more-btn');
 if(btnMore) {
  btnMore.onclick = () => {
   displayLimit += 150;
   table();
  };
 }
}

function setupSto(){
 const s=$('fsto'),r=$('fro').value;
 const l=r?RO[r]:[...RO.PLK,...RO.MTW];
 s.innerHTML='<option value="">Semua STO</option>'+l.map(x=>`<option>${x}</option>`).join('');
}

function draw(){
 markersLayer.clearLayers();
 const a=fil().filter(o=>isFinite(o.lat)&&isFinite(o.lon));
 if(!a.length)return;
 
 const bounds = [];
 let selectedLatLng = null;

 a.forEach(o=>{
  const stInfo = getStatusInfo(o);
  const marker=L.marker([o.lat,o.lon],{icon:L.divIcon({className:'custom-div-icon',html:`<div style="background:${stInfo.color};width:14px;height:14px;border-radius:50%;border:2px solid #fff"></div>`,iconSize:[14,14],iconAnchor:[7,7]})});
  
  marker.bindTooltip(`<b>${o.odc}</b> (${o.sto})<br>Pemilik: ${g(o).namaPemilik || '-'}<br>Status: ${stInfo.label}`);
  marker.on('click',()=>{ 
   sel=o.odc; 
   openD(sel); 
   table(); 
   if(isFinite(o.lat) && isFinite(o.lon)) {
    map.setView([o.lat, o.lon], 17, {animate: true, pan: {duration: 0.5}});
   }
  });

  markersLayer.addLayer(marker);
  bounds.push([o.lat,o.lon]);

  if(o.odc === sel) selectedLatLng = [o.lat, o.lon];
 });

 if(selectedLatLng) {
  map.setView(selectedLatLng, 17, {animate: true});
 } else if(bounds.length && !map._initialBoundsFit) {
  map.fitBounds(bounds,{padding:[30,30],maxZoom:16});
  map._initialBoundsFit = true;
}
}

function refresh(t=true){kpis();stoPanel();if(t)table();draw()}
['fro','fsto','fst','q'].forEach(i=>$(i).addEventListener('input',()=>{if(i==='fro')setupSto();displayLimit=150;refresh()}));
$('th').onclick=()=>{const h=document.documentElement;h.dataset.theme=h.dataset.theme==='dark'?'light':'dark'};
$('imp').onclick=()=>$('file').click();

const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let cur=null;
function put(id,p){ST[id]=Object.assign(ST[id]||{},p,{odc:id});save()}

function compressImage(file, maxWidth = 1024, quality = 0.7) {
 return new Promise((resolve) => {
  if (!file.type.startsWith('image/')) {
   resolve(file);
   return;
  }
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
   const img = new Image();
   img.src = event.target.result;
   img.onload = () => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;
    if (width > maxWidth) {
     height = Math.round((height * maxWidth) / width);
     width = maxWidth;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    resolve(canvas.toDataURL('image/jpeg', quality));
   };
  };
 });
}

function openD(id){
 const o=D.find(x=>x.odc===id);
 if(!o)return;
 cur=id;
 const x=g(o), stInfo=getStatusInfo(o);
 const thumb=u=>{const m=String(u).match(/\/d\/([-\w]+)|[?&]id=([-\w]+)/);return m?'https://drive.google.com/thumbnail?id='+(m[1]||m[2])+'&sz=w640':u};
 
 const foto=(t,k)=>`<div class="ph"><b>${t}</b>${x[k]?`<a href="${E(x[k])}" target="_blank" rel="noopener"><img src="${E(thumb(x[k]))}" alt="${t}" loading="lazy"></a><div style="display:flex;gap:4px;margin-top:4px;"><button class="btn-del" data-del-card="${k}" data-odc-id="${E(id)}" style="background:var(--red);color:#fff;border:none;padding:2px 6px;border-radius:4px;font-size:11px;cursor:pointer;">Hapus</button><label class="up" style="margin:0;margin-left:auto;">Ganti<input type="file" accept="image/*" data-upload-card="${k}" data-odc-id="${E(id)}" hidden></label></div>`:'<div class="nop">Belum ada foto</div><label class="up">Unggah<input type="file" accept="image/*" data-upload-card="${k}" data-odc-id="${E(id)}" hidden></label>'}</div>`;

 $('dpt').textContent = id + ' (' + o.sto + ')';
 $('dpb').innerHTML = `
  <p class="sub"><b>${E(o.alamat)}</b><br>${o.tipe} · ${o.kap} port · Status: <b style="color:${stInfo.color}">${stInfo.label}</b></p>
  
  <div style="margin-bottom:10px;background:var(--bg);padding:8px;border-radius:6px;border:1px solid var(--line);">
   <label style="font-size:11px;font-weight:600;display:block;margin-bottom:3px;">Nama Pemilik / PIC Lahan:</label>
   <input type="text" data-card-k="namaPemilik" data-odc-id="${E(id)}" value="${E(x.namaPemilik)}" placeholder="Masukkan nama pemilik / PIC" style="width:100%;font-size:12px;padding:4px 6px;">
  </div>

  <div style="margin-bottom:12px;background:var(--bg);padding:8px;border-radius:6px;border:1px solid var(--line);">
   <label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;">Tipe Biaya:</label>
   <select data-card-k="tipeBiaya" data-odc-id="${E(id)}" style="width:100%;font-size:12px;padding:4px;">
    <option value="OTC" ${x.tipeBiaya==='OTC'?'selected':''}>OTC (One Time Charge)</option>
    <option value="RECURRING" ${x.tipeBiaya==='RECURRING'?'selected':''}>RECURRING (Berlangganan/Sewa)</option>
   </select>
  </div>

  <div class="doc-grid">
   <div class="doc-card gov">
    <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7h18v14H3zM12 11v6M9 14h6"/></svg> Izin Pemerintah</h3>
    <p>Dinas & instansi</p>
    <div class="doc-actions">
     ${x.linkGov ? `<a href="${E(x.linkGov)}" target="_blank">Lihat</a><button class="btn-del" data-del-card="linkGov" data-odc-id="${E(id)}" style="background:var(--red);color:#fff;border:none;padding:2px 6px;border-radius:4px;font-size:11px;cursor:pointer;">Hapus</button>` : '<span style="font-size:11px;color:var(--mut)">Belum ada</span>'}
     <label class="btn-upload" style="margin-left:auto;">${x.linkGov?'Ganti':'Unggah'}<input type="file" accept=".pdf,image/*" data-upload-card="linkGov" data-odc-id="${E(id)}" hidden></label>
    </div>
   </div>

   <div class="doc-card com">
    <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Izin Masyarakat</h3>
    <p>Camat, lurah, RT</p>
    <div class="doc-actions">
     ${x.linkCom ? `<a href="${E(x.linkCom)}" target="_blank">Lihat</a><button class="btn-del" data-del-card="linkCom" data-odc-id="${E(id)}" style="background:var(--red);color:#fff;border:none;padding:2px 6px;border-radius:4px;font-size:11px;cursor:pointer;">Hapus</button>` : '<span style="font-size:11px;color:var(--mut)">Belum ada</span>'}
     <label class="btn-upload" style="margin-left:auto;">${x.linkCom?'Ganti':'Unggah'}<input type="file" accept=".pdf,image/*" data-upload-card="linkCom" data-odc-id="${E(id)}" hidden></label>
    </div>
   </div>

   <div class="doc-card sitac">
    <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> SITAC</h3>
    <p>Site acquisition</p>
    <div style="margin-top:2px;">
     <label style="font-size:11px;color:var(--mut);display:block;margin-bottom:2px;">Masa Berlaku Sitac:</label>
     <input type="date" data-card-k="expSitac" data-odc-id="${E(id)}" value="${E(x.expSitac)}" style="width:100%;font-size:12px;padding:3px 6px;cursor:pointer;">
    </div>
    <div class="doc-actions">
     ${x.linkSitac ? `<a href="${E(x.linkSitac)}" target="_blank">Lihat</a><button class="btn-del" data-del-card="linkSitac" data-odc-id="${E(id)}" style="background:var(--red);color:#fff;border:none;padding:2px 6px;border-radius:4px;font-size:11px;cursor:pointer;">Hapus</button>` : '<span style="font-size:11px;color:var(--mut)">Belum ada</span>'}
     <label class="btn-upload" style="margin-left:auto;">${x.linkSitac?'Ganti':'Unggah'}<input type="file" accept=".pdf,image/*" data-upload-card="linkSitac" data-odc-id="${E(id)}" hidden></label>
    </div>
   </div>

   <div class="doc-card pay">
    <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> Kwitansi</h3>
    <p>Bukti pembayaran</p>
    <div class="doc-actions">
     ${x.linkPay ? `<a href="${E(x.linkPay)}" target="_blank">Lihat</a><button class="btn-del" data-del-card="linkPay" data-odc-id="${E(id)}" style="background:var(--red);color:#fff;border:none;padding:2px 6px;border-radius:4px;font-size:11px;cursor:pointer;">Hapus</button>` : '<span style="font-size:11px;color:var(--mut)">Belum ada</span>'}
     <label class="btn-upload" style="margin-left:auto;">${x.linkPay?'Ganti':'Unggah'}<input type="file" accept=".pdf,image/*" data-upload-card="linkPay" data-odc-id="${E(id)}" hidden></label>
    </div>
   </div>
  </div>

  <h2>Foto ODC</h2>
  <div class="phs">${foto('Tampak Dalam','fotoDalam')}${foto('Tampak Luar','fotoLuar')}</div>
 `;
 $('dp').hidden=false;
}

$('tb').addEventListener('click', e=>{
 const tr=e.target.closest('tr');
 if(!tr || !tr.dataset.id) return;
 sel=tr.dataset.id;
 openD(sel); table(); draw();
});
$('dpc').onclick=()=>{$('dp').hidden=true;cur=null};

$('dpb').addEventListener('click', async e => {
 const btn = e.target.closest('[data-del-card]');
 if(!btn) return;
 
 const fieldKey = btn.dataset.delCard;
 const id = btn.dataset.odcId || cur;
 if(!id) return;

 if(confirm('Apakah Anda yakin ingin menghapus dokumen/foto ini?')) {
  put(id, { [fieldKey]: '' });
  refresh(false);
  openD(id);

  if(APPS_SCRIPT_URL){
   try {
    const res = await fetch(APPS_SCRIPT_URL, {
     method: 'POST',
     body: JSON.stringify({ action: 'delete', odc: id, field: fieldKey })
    });
    const json = await res.json();
    if(json.status !== 'success') {
     alert('Gagal menghapus dari server, namun terhapus di perangkat lokal.');
    }
   } catch(err) {
    console.error(err);
    alert('Mode Offline: Berhasil dihapus secara lokal.');
   }
  }
 }
});

$('dpb').addEventListener('change', async e=>{
 const t=e.target;
 const id=t.dataset.odcId || cur;
 if(!id) return;

 if(t.dataset.uploadCard){
  const fieldKey=t.dataset.uploadCard;
  const file=t.files[0];
  if(!file) return;

  alert('Mengompres & mengunggah '+file.name+'...');
  try {
   const processedData = await compressImage(file);
   const payload = typeof processedData === 'string' ? processedData : await new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.readAsDataURL(file);
   });

   const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({fileData: payload, fileName: file.name, mimeType: file.type, odc: id, field: fieldKey})
   });
   const json = await res.json();
   if(json.status==='success'){
    put(id,{[fieldKey]:json.fileUrl});
    alert('Berhasil mengunggah/mengganti dokumen & link tersimpan!');
    refresh(false);
    openD(id);
   }else{
    alert('Gagal unggah: '+(json.message||'Kesalahan server'));
   }
  }catch(err){
   console.error(err);
   alert('Gagal terhubung ke Apps Script atau jaringan bermasalah.');
  }
  return;
 }

 const k=t.dataset.cardK;
 if(k){
  put(id,{[k]:t.value});
  refresh(false);
  if(APPS_SCRIPT_URL){
   fetch(APPS_SCRIPT_URL,{method:'POST',body:JSON.stringify({odc:id,field:k,value:t.value})})
    .then(r=>r.json()).then(j=>{if(j.status!=='success')alert('Gagal sinkron data ke server')})
    .catch(()=>alert('Tersimpan di browser lokal (Offline Mode).'));
  }
 }
});

loadDataFromSheet();
