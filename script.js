const RO={PLK:['PLK','PYM','KSO','KRI','PPS','KKP','KKN'],MTW:['MTW','BNT','AMP','PRC','TML']};
const roOf=s=>RO.PLK.includes(s)?'PLK':RO.MTW.includes(s)?'MTW':'-';
const SAMPLE=`ODC-AMP-FA|AMP|JL. AMPAH - TAMIANG|C|288|-1.800405|115.149710|0
ODC-AMP-FB|AMP|JL. AMPAH - TAMIANG|C|288|-1.810737|115.164842|0
ODC-AMP-FC|AMP|JL. AMPAH KOTA (SDN4 AMPAH)|C|288|-1.789715|115.151166|0
ODC-BNT-FA|BNT|JL. PELITA RAYA|B|48|-1.718851|114.845545|0
ODC-BNT-FB|BNT|JL. PAHLAWAN|C|288|-1.714872|114.852447|0
ODC-BNT-FC|BNT|JL. SOEKARNO HATTA|C|144|-1.683461|114.907445|0
ODC-MTW-FA|MTW|KOMP. PERUM PERMATA INDAH|C|288|-0.93702|114.88893|0
ODC-MTW-FB|MTW|JL. TAMAN REMAJA|C|288|-0.943229|114.891917|0
ODC-MTW-FC|MTW|JL. PRAMUKA|C|288|-0.94985|114.89573|0
ODC-MTW-FD|MTW|JL. AHMAD YANI|B|48|-0.947273|114.900688|0
ODC-KKN-FA|KKN|JL. DIPONEGORO|C|288|-1.124677|113.85802|0
ODC-KKN-FB|KKN|JL. SABIRIN MUKHTAR|C|288|-1.102517|113.865536|0
ODC-KKN-FC|KKN|JL. TUGU TEWAH|C|288|-1.052866|113.726397|0
ODC-KKP-FA|KKP|JL. TAMBUN BUNGAI|C|288|-3.014157|114.38626|0
ODC-KKP-FB|KKP|JL. JENDERAL SUDIRMAN|C|288|-3.023617|114.391483|1
ODC-KKP-FC|KKP|JL. TAMBUN BUNGAI|B|48|-3.00805|114.388967|0
ODC-KKP-FW|KKP|JL. CILIK RIWUT|C|288|-3.007769|114.401414|1
ODC-KSO-FA|KSO|JL. TRANS KALIMANTAN|C|288|-1.88576|113.39986|0
ODC-KSO-FB|KSO|JL. TRANS KALIMANTAN|C|288|-1.88737|113.41325|0
ODC-KSO-FD|KSO|JL. SOEKARNO HATTA|B|48|-1.875609|113.423849|0
ODC-KRI-FG|KRI|JL. PEMBANGUNAN|C|144|-1.897977|113.297113|0
ODC-KRI-FK|KRI|JL. TJILIK RIWUT|C|288|-1.893464|113.296831|0`;
let D=[],ST={},sel=null,view={z:1,ox:0,oy:0},pts=[];
const $=id=>document.getElementById(id);
const IZ=['Belum','Proses','Terbit'],SI=['Belum','Proses','Lengkap'];
try{ST=JSON.parse(localStorage.getItem('odc-st-v1')||'{}')}catch(e){ST={}}
const save=()=>{try{localStorage.setItem('odc-st-v1',JSON.stringify(ST))}catch(e){}};
function loadSample(){D=SAMPLE.split('\n').map((l,i)=>{const p=l.split('|');const h=(i*7)%5;return{odc:p[0],sto:p[1],alamat:p[2],tipe:p[3],kap:p[4],lat:+p[5],lon:+p[6],was:p[7]==='1',izin:h<2?'Terbit':h==2?'Proses':'Belum',sitac:h==0?'Lengkap':h==3?'Proses':'Belum',exp:h==1?'2027-01-20':h==0?'2028-03-01':'',link:''}});}
function g(o){const s=ST[o.odc]||{};return{izin:s.izin||o.izin||'Belum',sitac:s.sitac||o.sitac||'Belum',exp:s.exp??o.exp??'',link:s.link??o.link??''}}
function cls(o){const s=g(o);if(s.izin==='Terbit'&&s.sitac==='Lengkap')return'ok';if(s.izin==='Belum'&&s.sitac==='Belum')return'none';return'part'}
function expSoon(o){const e=g(o).exp;if(!e)return false;return (new Date(e)-Date.now())/864e5<=90}
const col=c=>getComputedStyle(document.documentElement).getPropertyValue(c).trim();
function fil(){const r=$('fro').value,s=$('fsto').value,t=$('fst').value,q=$('q').value.toLowerCase();
 return D.filter(o=>{const x=g(o);return(!r||roOf(o.sto)===r)&&(!s||o.sto===s)&&(!q||(o.odc+o.alamat).toLowerCase().includes(q))&&
 (!t||(t==='ok'?cls(o)==='ok':t==='none'?cls(o)==='none':t==='part'?cls(o)==='part':t==='noizin'?x.izin==='Belum':t==='nositac'?x.sitac==='Belum':expSoon(o)))})}
function kpis(){const n=D.length||1,c=k=>D.filter(o=>g(o)[k]===(k==='izin'?'Terbit':'Lengkap')).length;
 const iz=c('izin'),si=c('sitac'),bi=D.filter(o=>g(o).izin==='Belum').length,bs=D.filter(o=>g(o).sitac==='Belum').length,w=D.filter(o=>o.was).length,ex=D.filter(expSoon).length;
 const k=(v,l,c)=>`<div class="k ${c||''}"><b>${v}</b><span>${l}</span></div>`;
 $('kpis').innerHTML=k(D.length,'Total ODC')+k(Math.round(iz/n*100)+'%','Izin terbit ('+iz+')','g')+k(Math.round(si/n*100)+'%','Sitac lengkap ('+si+')','g')+k(bi,'ODC belum ada izin','r')+k(bs,'ODC belum ada sitac','r')+k(ex,'Izin habis ≤ 90 hari','a')+k(Math.round(w/n*100)+'%','Sudah WASAKA ('+w+')')}
function stoPanel(){let h='';for(const r of['PLK','MTW']){h+=`<div class="ro">RO ${r}</div>`;for(const s of RO[r]){const a=D.filter(o=>o.sto===s),n=a.length,ok=a.filter(o=>cls(o)==='ok').length,pt=a.filter(o=>cls(o)==='part').length,no=n-ok-pt,p=v=>n?v/n*100:0;
 h+=`<div class="sto"><span>${s}</span><div class="sb" title="${ok} lengkap, ${pt} sebagian, ${no} belum"><i style="width:${p(ok)}%;background:var(--grn)"></i><i style="width:${p(pt)}%;background:var(--amb)"></i><i style="width:${p(no)}%;background:var(--red)"></i></div><span>${n?ok+'/'+n:'–'}</span></div>`}}
 $('sto').innerHTML=h}
function table(){const a=fil();$('cnt').textContent=a.length+' dari '+D.length+' ODC';
 const opt=(L,v)=>L.map(x=>`<option${x===v?' selected':''}>${x}</option>`).join('');
 $('tb').innerHTML=a.length?a.slice(0,300).map(o=>{const x=g(o),id=o.odc;return`<tr data-id="${E(id)}" class="${sel===id?'sel':''}"><td>${E(id)}</td><td>${E(o.sto)}</td><td>${E(o.alamat)}</td><td>${o.tipe}${o.kap?' / '+o.kap:''}</td><td>${o.was?'Sudah':'Belum'}</td>
 <td><select data-k="izin">${opt(IZ,x.izin)}</select></td><td><input type="date" data-k="exp" value="${E(x.exp)}"></td><td><select data-k="sitac">${opt(SI,x.sitac)}</select></td><td><input data-k="link" value="${E(x.link)}" placeholder="https://drive.google.com/…" size="26"></td><td>${isFinite(o.lat)?`<a style="color:var(--acc)" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${o.lat},${o.lon}&t=k">Satelit</a> · <a style="color:var(--acc)" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${o.lat},${o.lon}">Peta</a>`:'-'}</td></tr>`}).join(''):'<tr><td colspan="10" class="empty">Tidak ada ODC yang cocok dengan filter.</td></tr>'}
function setupSto(){const s=$('fsto'),r=$('fro').value;const l=r?RO[r]:[...RO.PLK,...RO.MTW];s.innerHTML='<option value="">Semua STO</option>'+l.map(x=>`<option>${x}</option>`).join('')}
/* peta */
const cv=$('cv'),cx=cv.getContext('2d');
function draw(){const W=cv.clientWidth,H=cv.clientHeight,dp=devicePixelRatio||1;cv.width=W*dp;cv.height=H*dp;cx.setTransform(dp,0,0,dp,0,0);
 cx.fillStyle=col('--map');cx.fillRect(0,0,W,H);cx.strokeStyle=col('--grid');cx.lineWidth=1;
 for(let x=0;x<W;x+=50){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,H);cx.stroke()}for(let y=0;y<H;y+=50){cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke()}
 const a=fil().filter(o=>isFinite(o.lat)&&isFinite(o.lon));pts=[];
 if(!a.length){cx.fillStyle=col('--mut');cx.textAlign='center';cx.fillText('Tidak ada titik untuk ditampilkan',W/2,H/2);return}
 const m=Math.cos(a[0].lat*Math.PI/180),X=a.map(o=>o.lon*m),Y=a.map(o=>-o.lat),x0=Math.min(...X),x1=Math.max(...X),y0=Math.min(...Y),y1=Math.max(...Y);
 const sc=Math.min((W-80)/Math.max(x1-x0,1e-3),(H-80)/Math.max(y1-y0,1e-3))*view.z;
 const px=v=>(v-(x0+x1)/2)*sc+W/2+view.ox,py=v=>(v-(y0+y1)/2)*sc+H/2+view.oy;
 const cen={};
 a.forEach((o,i)=>{const x=px(X[i]),y=py(Y[i]),c=cls(o),cc=col(c==='ok'?'--grn':c==='none'?'--red':'--amb');pts.push({x,y,o});
  (cen[o.sto]=cen[o.sto]||[]).push([x,y]);
  if(c==='none'){cx.fillStyle=cc+'33';cx.beginPath();cx.arc(x,y,10,0,7);cx.fill()}
  cx.fillStyle=cc;cx.beginPath();cx.arc(x,y,5,0,7);cx.fill();
  if(o.odc===sel){cx.strokeStyle=col('--tx');cx.lineWidth=2;cx.beginPath();cx.arc(x,y,10,0,7);cx.stroke()}});
 cx.fillStyle=col('--tx');cx.font='600 12px "IBM Plex Sans",sans-serif';cx.textAlign='center';
 for(const s in cen){const c=cen[s],mx=c.reduce((u,v)=>u+v[0],0)/c.length,my=Math.min(...c.map(v=>v[1]))-14;cx.fillText(s,mx,my)}}
function hit(e){const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;return pts.find(p=>Math.hypot(p.x-x,p.y-y)<9)}
let drag=null;
cv.onmousedown=e=>drag={x:e.clientX,y:e.clientY,ox:view.ox,oy:view.oy,m:false};
addEventListener('mouseup',e=>{if(drag&&!drag.m&&e.target===cv){const h=hit(e);if(h){sel=h.o.odc;openD(sel);table();draw();const r=document.querySelector(`tr[data-id="${sel}"]`);r&&r.scrollIntoView({block:'center'})}}drag=null});
cv.onmousemove=e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.m=true;if(drag.m){view.ox=drag.ox+dx;view.oy=drag.oy+dy;draw()}return}
 const h=hit(e),t=$('tip');if(h){const x=g(h.o);t.style.display='block';t.style.left=h.x+12+'px';t.style.top=h.y+12+'px';t.textContent=`${h.o.odc} · Izin: ${x.izin} · Sitac: ${x.sitac}`}else t.style.display='none'};
cv.onmouseleave=()=>$('tip').style.display='none';
cv.addEventListener('wheel',e=>{e.preventDefault();view.z=Math.min(40,Math.max(.5,view.z*(e.deltaY<0?1.2:1/1.2)));draw()},{passive:false});
/* aksi */
$('tb').addEventListener('change',e=>{const k=e.target.dataset.k;if(!k)return;const id=e.target.closest('tr').dataset.id;put(id,{[k]:e.target.value});refresh(false)});
function refresh(t=true){kpis();stoPanel();if(t)table();else{$('cnt').textContent=fil().length+' dari '+D.length+' ODC'}draw()}
['fro','fsto','fst','q'].forEach(i=>$(i).addEventListener('input',()=>{if(i==='fro')setupSto();view={z:1,ox:0,oy:0};refresh()}));
$('th').onclick=()=>{const h=document.documentElement;h.dataset.theme=h.dataset.theme==='dark'?'light':'dark';draw()};
addEventListener('resize',draw);
$('imp').onclick=()=>$('file').click();
function parseCSV(t){const d=(t.split('\n')[0].match(/\t/g)||[]).length?'\t':(t.split('\n')[0].split(';').length>t.split('\n')[0].split(',').length?';':',');const R=[];let r=[],f='',q=false;
 for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===d){r.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;r.push(f);R.push(r);r=[];f=''}else f+=c}
 if(f||r.length){r.push(f);R.push(r)}return R}
$('file').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{
 const R=parseCSV(rd.result),H=R[0].map(h=>h.trim().toUpperCase()),ix=n=>H.indexOf(n),I={odc:ix('ODC'),sto:ix('STO'),al:ix('ALAMAT'),tp:ix('TYPE ODC'),kp:ix('KAPASITAS'),la:ix('LATITUDE'),lo:ix('LONGITUDE'),wa:ix('SABUK ODC (WASAKA)'),iz:ix('IZIN'),si:ix('SITAC'),ex:ix('MASA BERLAKU IZIN'),li:ix('LINK DOKUMEN')};
 if(I.odc<0||I.sto<0){alert('Kolom ODC dan STO tidak ditemukan. Ekspor tab data ODC dari Sheets sebagai CSV, dengan baris judul di baris pertama.');return}
 const v=(r,i)=>i>=0?(r[i]||'').trim():'',num=s=>parseFloat(s.replace('°','').replace(',','.'));
 D=R.slice(1).filter(r=>v(r,I.odc)).map(r=>({odc:v(r,I.odc),sto:v(r,I.sto).toUpperCase(),alamat:v(r,I.al),tipe:v(r,I.tp).replace('ODC-',''),kap:v(r,I.kp),lat:num(v(r,I.la)),lon:num(v(r,I.lo)),was:/^SUDAH/i.test(v(r,I.wa)),
  izin:IZ.find(x=>x.toLowerCase()===v(r,I.iz).toLowerCase())||'Belum',sitac:SI.find(x=>x.toLowerCase()===v(r,I.si).toLowerCase())||'Belum',exp:v(r,I.ex),link:v(r,I.li)}));
 $('demo').style.display='none';$('src').textContent='Diimpor dari '+f.name+' ('+D.length+' ODC)';sel=null;view={z:1,ox:0,oy:0};refresh()};rd.readAsText(f);e.target.value=''};
$('exp').onclick=()=>{const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';const L=['ODC,STO,RO,ALAMAT,TYPE ODC,KAPASITAS,LATITUDE,LONGITUDE,SABUK ODC (WASAKA),IZIN,MASA BERLAKU IZIN,SITAC,LINK DOKUMEN'];
 D.forEach(o=>{const x=g(o);L.push([o.odc,o.sto,roOf(o.sto),o.alamat,o.tipe,o.kap,o.lat,o.lon,o.was?'SUDAH WASAKA':'BELUM WASAKA',x.izin,x.exp,x.sitac,x.link].map(q).join(','))});
 const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('\ufeff'+L.join('\n'));a.download='monitoring-odc.csv';a.click()};
/* detail ODC */
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let cur=null,DB=null,AS=null;
const key=s=>s.replace(/[^A-Za-z0-9_-]/g,'_');
function put(id,p){ST[id]=Object.assign(ST[id]||{},p,{odc:id});save();if(DB)DB.doc('odc/'+key(id)).set(ST[id]).catch(()=>{})}
function openD(id){const o=D.find(x=>x.odc===id);if(!o)return;cur=id;const s=ST[id]||{},kap=+o.kap||0,pu=+s.pu||0,pr=+s.pr||0,fr=Math.max(0,kap-pu-pr),tr=s.tray||[],pc=v=>kap?Math.min(100,v/kap*100):0;
 const opt=(L,v)=>L.map(x=>`<option${x===v?' selected':''}>${x}</option>`).join('');
 const ph=(k,t)=>`<div class="ph"><b>${t}</b>${s[k]?`<a href="/_blob/${E(s[k])}" target="_blank" rel="noopener"><img src="/_blob/${E(s[k])}" alt="${t}"></a>`:'<div class="nop">Belum ada foto</div>'}${AS?`<label class="up">Unggah foto<input type="file" accept="image/*" data-up="${k}" hidden></label>`:''}</div>`;
 $('dpt').textContent=id;
 $('dpb').innerHTML=`<p class="sub">STO ${E(o.sto)} · RO ${roOf(o.sto)}<br>${E(o.alamat)}<br>${E(o.tipe)} · ${kap} port · <a style="color:var(--acc)" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${o.lat},${o.lon}&t=k">Satelit</a></p>
 <div class="phs">${ph('fo','Foto ODC (luar)')}${ph('fd','Foto dalam ODC')}</div>${AS?'':'<p class="sub">Unggah foto hanya tersedia untuk Editor artifact ini.</p>'}
 <h2>Port</h2><div class="pb"><i style="width:${pc(pu)}%;background:var(--acc)"></i><i style="width:${pc(pr)}%;background:var(--red)"></i></div>
 <p class="sub">Kapasitas ${kap} · Terpakai ${pu} · Rusak ${pr} · Kosong ${fr}</p>
 <div class="bar"><label>Terpakai <input type="number" min="0" data-p="pu" value="${pu}" style="width:80px"></label><label>Rusak <input type="number" min="0" data-p="pr" value="${pr}" style="width:80px"></label></div>
 <h2>Isi tray & port</h2>
 <table><tr><th>Tray</th><th>Port</th><th>Status</th><th>Keterangan</th><th></th></tr>${tr.map((r,i)=>`<tr data-i="${i}"><td><input data-f="tray" value="${E(r.tray)}"></td><td><input data-f="port" value="${E(r.port)}"></td><td><select data-f="status">${opt(['Terpakai','Kosong','Rusak'],r.status)}</select></td><td><input data-f="ket" value="${E(r.ket)}"></td><td><button data-del="${i}" aria-label="Hapus baris">✕</button></td></tr>`).join('')}</table>
 <button id="addt" style="margin-top:6px">Tambah baris</button>`;
 $('dp').hidden=false}
$('tb').addEventListener('click',e=>{if(e.target.closest('select,input,a'))return;const r=e.target.closest('tr');if(!r||!r.dataset.id)return;sel=r.dataset.id;openD(sel);table();draw()});
$('dpc').onclick=()=>{$('dp').hidden=true;cur=null};
$('dpb').addEventListener('change',async e=>{const t=e.target,id=cur,s=ST[id]||{};
 if(t.dataset.up){try{const r=await AS.upload(t.files[0]);put(id,{[t.dataset.up]:r.id});openD(id)}catch(x){alert('Unggah foto gagal: '+(x.message||x.code||'coba lagi'))}return}
 if(t.dataset.p){put(id,{[t.dataset.p]:+t.value||0});openD(id);return}
 const row=t.closest('tr');if(t.dataset.f&&row){const tr=(s.tray||[]).map(r=>({...r}));tr[+row.dataset.i][t.dataset.f]=t.value;put(id,{tray:tr})}});
$('dpb').addEventListener('click',e=>{const id=cur,tr=((ST[id]||{}).tray||[]).slice();
 if(e.target.id==='addt'){tr.push({tray:'',port:'',status:'Terpakai',ket:''});put(id,{tray:tr});openD(id)}
 else if(e.target.dataset.del!=null){tr.splice(+e.target.dataset.del,1);put(id,{tray:tr});openD(id)}});
loadSample();$('src').textContent='sampel 22 ODC dari sheet Anda';setupSto();refresh();
(async()=>{const u=async n=>{try{return await claude.use(n)}catch(e){return null}};DB=await u('db');AS=await u('assets');
 if(cur)openD(cur);
 if(DB)DB.collection('odc').onSnapshot(sn=>{sn.docs.forEach(d=>{const v=d.data();if(v&&v.odc)ST[v.odc]=v});save();refresh();if(cur&&!$('dpb').contains(document.activeElement))openD(cur)},()=>{})})();
