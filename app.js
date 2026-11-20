/* ChronoXStar app. Dibungkus fungsi supaya tidak ada variabel global yang bisa diutak-atik dari console. */
(function(){
function start(){
/* Isi Site Key Cloudflare Turnstile di bawah untuk verifikasi anti-bot yang lebih kuat (opsional) */
const CX=window.CX||{},TURNSTILE_SITEKEY=CX.TURNSTILE_SITEKEY||'';
/* Supabase client (publishable key memang publik; keamanan dijaga RLS di setup.sql) */
const SB_URL=CX.SUPABASE_URL,sb=supabase.createClient(SB_URL,CX.SUPABASE_KEY);
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),enc=encodeURIComponent;
let me=null,pf=null,P={},ch=null,cur='home',reg=false;
let S={channel:'https://whatsapp.com/channel/0029Vb9kIdD2f3ELjmdI5p3i',admin_wa:'6283189141345',ig:'chronoxstar',info:'Selamat datang di ChronoXStar'};
const isAd=()=>pf?.role==='admin';
function toast(t){const e=$('#ts');e.textContent=t;e.hidden=false;clearTimeout(toast.i);toast.i=setTimeout(()=>e.hidden=true,3200)}
function go(v){cur=v;document.querySelectorAll('.v').forEach(e=>e.hidden=e.id!=='v-'+v);document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.go===v));({chat:openChat,me:renderMe,admin:renderAdmin,home:homeUser,info:loadInfo})[v]?.();scrollTo(0,0)}
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)go(g.dataset.go)});

/* Pengaturan situs (diubah admin) */
async function loadS(){const{data}=await sb.from('settings').select('*');(data||[]).forEach(r=>S[r.key]=r.value);
 tick();banner();pinned();$('#l-ch').href=/^https:\/\//.test(S.channel)?S.channel:'#';
 $('#l-wa').href='https://wa.me/'+S.admin_wa.replace(/\D/g,'');$('#l-ig').href='https://instagram.com/'+enc(S.ig.replace(/[^\w.]/g,''))}

/* Auth */
let cq=0,cTok=null,t0f=Date.now(),fails=0,lockUntil=0;
const newQ=()=>{const a=2+Math.random()*8|0,b=2+Math.random()*8|0;cq=a+b;$('#hq').textContent='Verifikasi manusia: '+a+' + '+b+' = ?';$('#ha').value=''};
function authMode(r){reg=r;t0f=Date.now();$('#au').hidden=!r;$('#hc').hidden=!(r&&!TURNSTILE_SITEKEY);if(r&&!TURNSTILE_SITEKEY)newQ();
 $('#am-t').textContent=r?'Daftar':'Masuk';$('#am-sw').textContent=r?'Sudah punya akun? Masuk':'Belum punya akun? Daftar';$('#ap').autocomplete=r?'new-password':'current-password'}
$('#am-sw').onclick=()=>authMode(!reg);
if(TURNSTILE_SITEKEY){const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.onload=()=>turnstile.render('#tsb',{sitekey:TURNSTILE_SITEKEY,theme:'dark',callback:t=>cTok=t,'expired-callback':()=>cTok=null});document.head.appendChild(s)}
$('#lg').onclick=()=>me?go('me'):$('#am').showModal();
$('#af').onsubmit=async e=>{e.preventDefault();if($('#hp').value)return;
 const em=$('#ae').value.trim(),pw=$('#ap').value,un=$('#au').value.trim().toLowerCase(),opt={};
 if(Date.now()<lockUntil)return toast('Terlalu banyak percobaan. Coba lagi '+Math.ceil((lockUntil-Date.now())/1000)+' detik');if(reg&&navigator.webdriver)return toast('Browser otomatis tidak diizinkan mendaftar');if(TURNSTILE_SITEKEY){if(!cTok)return toast('Selesaikan verifikasi dulu');opt.captchaToken=cTok}
 else if(reg){if(+$('#ha').value!==cq){newQ();return toast('Jawaban verifikasi salah')}if(Date.now()-t0f<4000)return toast('Terlalu cepat, coba lagi sebentar')}
 let r;
 if(reg){if(!/^\w{3,20}$/.test(un))return toast('Username 3-20 huruf/angka/_');if(pw.length<8)return toast('Password minimal 8 karakter');
  const{data:free}=await sb.rpc('username_free',{p_name:un});if(free===false)return toast('Username sudah dipakai');
  r=await sb.auth.signUp({email:em,password:pw,options:{...opt,data:{username:un}}})}
 else r=await sb.auth.signInWithPassword({email:em,password:pw,options:opt});
 if(TURNSTILE_SITEKEY){cTok=null;turnstile.reset()}
 if(r.error){if(reg&&!TURNSTILE_SITEKEY)newQ();if(!reg&&++fails>=5){lockUntil=Date.now()+60000;fails=0}return toast(r.error.message)}
 $('#am').close();const wr=reg;$('#af').reset();authMode(false);
 if(wr&&!r.data.session)return toast('Pendaftaran berhasil. Cek email untuk verifikasi, lalu masuk');
 toast('Berhasil masuk');fails=0;await sb.rpc('log_event',{p_action:'login',p_detail:DEV.info})};
async function setUser(u){me=u||null;pf=null;
 if(me){let{data}=await sb.from('profiles').select('*').eq('id',me.id).maybeSingle();
  if(!data){const r=await sb.rpc('ensure_profile');data=r.data}
  pf=data;if(pf)P[me.id]=pf}
 else if(ch){sb.removeChannel(ch);ch=null}
 $('#lg').textContent=me?'@'+(pf?.username||'akun'):'Masuk';$('#nadmin').hidden=!isAd();$('#lg').classList.toggle('adm',isAd());
 clearInterval(setUser.i);
 if(me){const f=()=>sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',me.id).then(()=>{});f();setUser.i=setInterval(f,60000)}}

/* Chat global */
const SU=SB_URL+'/storage/v1/object/public/';
const av=(p,id)=>{const i=id||p?.id||'';return p?.avatar_url&&p.avatar_url.startsWith(SU+'avatars/')?`<img class="pa" data-u="${i}" src="${esc(p.avatar_url)}" alt="">`:`<span class="pa" data-u="${i}">${esc(((p?.username||'?')[0]||'?').toUpperCase())}</span>`};
let INFO=[],INFO_ERR='';
function pinned(){const e=$('#pin'),f=INFO[0];e.hidden=!f;if(f)e.innerHTML='<small>Informasi terbaru</small><br><b>'+esc(f.title)+'</b>'}
function banner(){const u=S.banner_url;if(!u||!u.startsWith(SU+'site/'))return;
 if(S.banner_type==='image'){$('#hv')?.remove();if(!$('#hi'))$('#hero').insertAdjacentHTML('afterbegin','<img id="hi" alt="">');$('#hi').src=u}
 else if($('#hv'))$('#hv').src=u}
async function profs(){const{data}=await sb.from('profiles').select('*').limit(1000);(data||[]).forEach(p=>P[p.id]=p)}
function msgHTML(m){const p=P[m.user_id]||{};
 return`<div class="m${m.user_id===me?.id?' me':''}${p.role==='admin'?' adm':''}" data-id="${m.id}">${isAd()?`<button class="btn d x" data-del="${m.id}">hapus</button>`:''}${av(p,m.user_id)}<span class="u" data-u="${m.user_id}">${esc(p.username||'user')}</span>${bdg(p)} <span class="tm">${new Date(m.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span><div>${esc(m.content)}</div></div>`}
const near=()=>{const b=$('#msgs');return b.scrollHeight-b.scrollTop-b.clientHeight<140};
function add(m){const b=$('#msgs');if(b.querySelector('[data-id="'+m.id+'"]'))return;const st=near()||m.user_id===me?.id;b.insertAdjacentHTML('beforeend',msgHTML(m));if(st)b.scrollTo({top:b.scrollHeight,behavior:'smooth'});else $('#nm').hidden=false}
async function loadMsgs(){const{data,error}=await sb.from('messages').select('*').order('id',{ascending:false}).limit(100);const b=$('#msgs');
 if(error){b.innerHTML='<div class="card">Chat belum bisa dimuat: '+esc(error.message)+'<br>Jalankan setup.sql terbaru di Supabase.</div>';return}
 b.innerHTML=(data||[]).reverse().map(msgHTML).join('');b.scrollTop=b.scrollHeight;$('#nm').hidden=true}
async function pollMsgs(){const last=[...document.querySelectorAll('#msgs [data-id]')].pop()?.dataset.id||0;
 const{data}=await sb.from('messages').select('*').gt('id',last).order('id',{ascending:true}).limit(50);for(const m of data||[]){if(!P[m.user_id])await profs();add(m)}}
async function openChat(){$('#cg').hidden=!!me;$('#cf').hidden=!me;if(!me)return;
 $('#bn').hidden=!pf?.banned;$('#cfm').hidden=!!pf?.banned;
 await profs();$('#oc').textContent=Object.values(P).filter(p=>p.last_seen&&Date.now()-new Date(p.last_seen)<3e5).length+' member online';
 await loadMsgs();
 if(!ch)ch=sb.channel('gc').on('postgres_changes',{event:'*',schema:'public',table:'messages'},async pl=>{
  if(pl.eventType==='INSERT'){if(!P[pl.new.user_id])await profs();add(pl.new)}else loadMsgs()}).subscribe()}
$('#ci').oninput=()=>$('#cfm').classList.toggle('has',!!$('#ci').value.trim());
$('#msgs').onscroll=()=>{if(near())$('#nm').hidden=true};
$('#nm').onclick=()=>{$('#msgs').scrollTo({top:1e9,behavior:'smooth'});$('#nm').hidden=true};
$('#cfm').onsubmit=async e=>{e.preventDefault();const i=$('#ci'),t=i.value.trim();if(!t)return;
 const b=$('#snd');b.classList.remove('fly');void b.offsetWidth;b.classList.add('fly');i.value='';$('#cfm').classList.remove('has');
 const{data,error}=await sb.from('messages').insert({user_id:me.id,content:t.slice(0,500)}).select().single();
 if(error){i.value=t;$('#cfm').classList.add('has');return toast(error.message)}add(data)};
$('#msgs').onclick=async e=>{const d=e.target.dataset;
 if(d.del){const{error}=await sb.from('messages').delete().eq('id',d.del);error?toast(error.message):e.target.closest('.m').remove()}
 else if(d.u)showP(d.u)};
function links(p){return[p.instagram&&`<a href="https://instagram.com/${enc(p.instagram)}" target="_blank" rel="noopener noreferrer">Instagram @${esc(p.instagram)}</a>`,
 p.tiktok&&`<a href="https://tiktok.com/@${enc(p.tiktok)}" target="_blank" rel="noopener noreferrer">TikTok @${esc(p.tiktok)}</a>`,
 p.whatsapp&&`<a href="https://wa.me/${enc(p.whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`].filter(Boolean).join('')}
function showP(id){const p=P[id];if(!p)return;$('#pm-b').innerHTML=`<div style="display:flex;gap:10px;align-items:center">${av(p)}<h3>@${esc(p.username)} ${bdg(p)}</h3></div><p>${esc(p.bio||'Belum ada bio')}</p><div class="pst lk" style="justify-content:flex-start">${links(p)}</div>`;$('#pm').showModal()}

/* Informasi: admin menulis, semua membaca, tersinkron realtime seperti chat */
const ago2=t=>{const m=Math.round((Date.now()-new Date(t))/6e4);return m<1?'baru saja':m<60?m+' mnt lalu':m<1440?Math.round(m/60)+' jam lalu':new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})};
const seen=()=>{try{return localStorage.getItem('cx_seen')||''}catch{return''}};
function infoBadge(){const f=INFO[0],n=!!f&&f.created_at>seen()&&cur!=='info';$('#ibd').hidden=!n;$('#ilv').hidden=!n;$('#ip').textContent=f?f.title:'Belum ada informasi';pinned()}
async function loadInfo(){const{data,error}=await sb.from('info_posts').select('*').order('id',{ascending:false}).limit(30);INFO_ERR=error?error.message:'';INFO=data||[];if(cur==='info')renderInfo();else infoBadge()}
function renderInfo(){$('#inf').hidden=!isAd()||!!INFO_ERR;if(INFO_ERR){$('#ilist').innerHTML='<div class="card">Informasi belum bisa dimuat: '+esc(INFO_ERR)+'<br>Jalankan setup.sql terbaru di Supabase SQL Editor.</div>';return}const s=seen();
 $('#ilist').innerHTML=INFO.map(x=>`<div class="gl ic${x.created_at>s?' new':''}"><h3>${esc(x.title)}</h3><small>${ago2(x.created_at)}</small><p>${esc(x.body)}</p>${/^https:\/\//.test(x.link||'')?`<a class="btn p" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">Buka tautan</a>`:''}${isAd()?`<button class="btn d x" data-idel="${x.id}">hapus</button>`:''}</div>`).join('')||'<div class="card">Belum ada informasi.</div>';
 if(INFO[0])try{localStorage.setItem('cx_seen',INFO[0].created_at)}catch{}infoBadge()}
$('#inf').onsubmit=async e=>{e.preventDefault();const t=$('#it').value.trim(),b=$('#ib').value.trim(),l=$('#il').value.trim();
 if(!t||!b)return toast('Judul dan isi wajib diisi');if(l&&!/^https:\/\//.test(l))return toast('Tautan harus diawali https://');
 const{error}=await sb.from('info_posts').insert({title:t,body:b,link:l});if(error)return toast(error.message);
 $('#it').value=$('#ib').value=$('#il').value='';toast('Informasi diterbitkan');await sb.rpc('log_event',{p_action:'info',p_detail:t});loadInfo()};
$('#ilist').onclick=async e=>{const id=e.target.dataset.idel;if(!id||!confirm('Hapus informasi ini?'))return;const{error}=await sb.from('info_posts').delete().eq('id',id);error?toast(error.message):(toast('Informasi dihapus'),loadInfo())};

/* Profil sendiri */
const sq=f=>new Promise((ok,no)=>{const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{const c=document.createElement('canvas'),s=Math.min(i.width,i.height);c.width=c.height=256;c.getContext('2d').drawImage(i,(i.width-s)/2,(i.height-s)/2,s,s,0,0,256,256);URL.revokeObjectURL(u);c.toBlob(ok,'image/jpeg',.85)};i.onerror=()=>no(Error('File bukan gambar'));i.src=u});
function renderMe(){const b=$('#me');
 if(!me){b.innerHTML='<div class="card">Masuk dulu untuk mengatur profil.<br><br><button class="btn p" data-act="login">Masuk / Daftar</button></div>';return}
 if(!pf){b.innerHTML='<div class="card">Profil belum siap. Muat ulang halaman, atau pastikan setup.sql sudah dijalankan.</div>';return}
 const f=(id,l,v,x='')=>`<label>${l}</label><input id="f-${id}" value="${esc(v||'')}" ${x}>`,ch2=/^https:\/\//.test(S.channel)?S.channel:'#';
 b.innerHTML=`<div class="gl pcv"><div id="f-av">${av(pf)}<label class="cam"><svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><input type="file" id="f-p" accept="image/*"></label></div>
 <h3 style="font-size:18px">@${esc(pf.username)} ${bdg(pf)}</h3><div class="tm">${esc(me.email)} | bergabung ${new Date(pf.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</div>
 <p style="margin-top:8px;color:#cfe0ff">${esc(pf.bio||'Belum ada bio')}</p><div class="pst lk">${links(pf)||'<span class="tm">Belum ada tautan sosial</span>'}</div></div>
 <div class="card"><h3>Edit profil</h3>${f('u','Username',pf.username,'maxlength=20')}<label>Bio <span id="bc" class="tm">${(pf.bio||'').length}/200</span></label><textarea id="f-b" rows="3" maxlength="200">${esc(pf.bio||'')}</textarea>
 ${f('i','Instagram (tanpa @)',pf.instagram)}${f('t','TikTok (tanpa @)',pf.tiktok)}${f('w','WhatsApp (628...)',pf.whatsapp)}
 <button class="btn p" id="f-s" style="width:100%;margin-top:10px">Simpan profil</button></div>
 <div class="card"><h3>Keamanan</h3><label>Password baru (min. 8)</label><input id="f-pw" type="password" autocomplete="new-password"><button class="btn" id="f-pc" style="width:100%;margin-top:8px">Ganti password</button><button class="btn d" id="f-o" style="width:100%;margin-top:8px">Keluar</button></div>
 <div class="card"><h3>Tautan resmi</h3><div class="pst lk" style="justify-content:flex-start"><a href="${esc(ch2)}" target="_blank" rel="noopener noreferrer">Channel WhatsApp</a><a href="https://wa.me/${enc(S.admin_wa.replace(/\D/g,''))}" target="_blank" rel="noopener noreferrer">Chat Admin</a><a href="https://instagram.com/${enc(S.ig.replace(/[^\w.]/g,''))}" target="_blank" rel="noopener noreferrer">Instagram @${esc(S.ig)}</a></div></div>`;
 $('#f-b').oninput=e=>$('#bc').textContent=e.target.value.length+'/200';
 $('#f-p').onchange=async e=>{const fl=e.target.files[0];if(!fl)return;
  try{const bl=await sq(fl),path=me.id+'/avatar.jpg',up=await sb.storage.from('avatars').upload(path,bl,{upsert:true,contentType:'image/jpeg'});if(up.error)throw up.error;
   const url=SU+'avatars/'+path+'?v='+Date.now(),u2=await sb.from('profiles').update({avatar_url:url}).eq('id',me.id);if(u2.error)throw u2.error;
   pf.avatar_url=url;P[me.id]=pf;toast('Foto profil diperbarui');renderMe();homeUser()}catch(x){toast(x.message||'Gagal upload foto')}};
 $('#f-s').onclick=async()=>{const u={username:$('#f-u').value.trim().toLowerCase(),bio:$('#f-b').value.trim(),instagram:$('#f-i').value.replace(/[^\w.]/g,''),tiktok:$('#f-t').value.replace(/[^\w.]/g,''),whatsapp:$('#f-w').value.replace(/\D/g,'')};
  if(!/^\w{3,20}$/.test(u.username))return toast('Username 3-20 huruf/angka/_');
  const{error}=await sb.from('profiles').update(u).eq('id',me.id);
  if(error)return toast(error.code==='23505'?'Username sudah dipakai':error.message);
  Object.assign(pf,u);P[me.id]=pf;toast('Profil tersimpan');$('#lg').textContent='@'+u.username;renderMe()};
 $('#f-pc').onclick=async()=>{const pw=$('#f-pw').value;if(pw.length<8)return toast('Password minimal 8 karakter');const{error}=await sb.auth.updateUser({password:pw});error?toast(error.message):($('#f-pw').value='',toast('Password diganti'))};
 $('#f-o').onclick=async()=>{await sb.auth.signOut();go('home')}}

/* Dashboard admin (hak akses dijaga RLS + fungsi di setup.sql; member tidak bisa memakainya) */
const AL={login:'masuk',register:'mendaftar',admin_add:'menjadikan admin',admin_remove:'mencabut admin',ban:'membatasi chat',unban:'membuka batasan',delete_user:'menghapus akun',clear_chat:'membersihkan chat',banner:'mengubah banner',settings:'mengubah pengaturan',info:'menerbitkan info'};
async function bannerUp(){const f=$('#bn-f').files[0];if(!f)return toast('Pilih file banner dulu');if(f.size>50*1024*1024)return toast('Maksimal 50 MB');
 const ext=(f.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,''),path='banner/'+Date.now()+'.'+ext;toast('Mengunggah...');
 const{error}=await sb.storage.from('site').upload(path,f,{contentType:f.type});if(error)return toast(error.message);
 const old=S.banner_url,w=await sb.from('settings').upsert([{key:'banner_url',value:SU+'site/'+path},{key:'banner_type',value:f.type.startsWith('video/')?'video':'image'}]);
 if(w.error)return toast(w.error.message);
 if(old&&old.startsWith(SU+'site/'))await sb.storage.from('site').remove([old.slice((SU+'site/').length)]);
 await sb.rpc('log_event',{p_action:'banner',p_detail:'diganti'});location.reload()}
async function bannerReset(){if(!confirm('Kembalikan banner awal?'))return;const old=S.banner_url;
 const w=await sb.from('settings').upsert([{key:'banner_url',value:''},{key:'banner_type',value:''}]);if(w.error)return toast(w.error.message);
 if(old&&old.startsWith(SU+'site/'))await sb.storage.from('site').remove([old.slice((SU+'site/').length)]);
 await sb.rpc('log_event',{p_action:'banner',p_detail:'dikembalikan ke awal'});location.reload()}
async function healthCheck(){const o=$('#hc-out');o.textContent='Memeriksa...';const R=[];
 const C=async(n,fn,hint)=>{try{const r=await fn();R.push([n,!r.error,r.error?.message||'',hint])}catch(e){R.push([n,false,e.message,hint])}};
 for(const t of['profiles','messages','settings','activity','info_posts'])await C('Tabel '+t,()=>sb.from(t).select('*',{count:'exact',head:true}),'Jalankan setup.sql terbaru');
 await C('Fungsi admin_users',()=>sb.rpc('admin_users'),'Jalankan setup.sql terbaru');
 await C('Fungsi ensure_profile',()=>sb.rpc('ensure_profile'),'Jalankan setup.sql terbaru');
 for(const b of['avatars','site'])await C('Storage '+b,()=>sb.storage.from(b).list('',{limit:1}),'Buat bucket '+b+' (Public) atau jalankan setup.sql');
 R.push(['Koneksi HTTPS',location.protocol==='https:','','Pakai hosting https']);R.push(['Verifikasi Turnstile',!!TURNSTILE_SITEKEY,'','Opsional: isi TURNSTILE_SITEKEY di index.html']);
 o.innerHTML=R.map(([n,ok,m,hn])=>`<div class="act"><span><b>${esc(n)}</b>${ok?'':`<br><span class="tm">${esc(m||hn)}</span>`}</span><span style="color:${ok?'var(--gr)':'#ff6b86'}">${ok?'OK':'GAGAL'}</span></div>`).join('')}
async function renderAdmin(){if(!isAd())return go('home');const b=$('#ad');b.innerHTML='<div class="card">Memuat...</div>';
 const[a,c,u,em,ac]=await Promise.all([sb.from('profiles').select('*',{count:'exact',head:true}),sb.from('messages').select('*',{count:'exact',head:true}),
  sb.from('profiles').select('*').order('created_at',{ascending:false}).limit(200),sb.rpc('admin_users'),sb.from('activity').select('*').order('id',{ascending:false}).limit(40)]);
 if(u.error)return b.innerHTML='<div class="card">Gagal memuat: '+esc(u.error.message)+'</div>';
 const us=u.data,mail={},ow=me.email==='admin@kelas.com';(em.data||[]).forEach(x=>mail[x.id]=x.email);
 const on=us.filter(x=>x.last_seen&&Date.now()-new Date(x.last_seen)<3e5).length,
 ago=t=>{if(!t)return'belum pernah';const m=Math.round((Date.now()-new Date(t))/6e4);return m<1?'online':m<60?m+' mnt lalu':m<1440?Math.round(m/60)+' jam lalu':Math.round(m/1440)+' hari lalu'},
 s=(k,l)=>`<label>${l}</label><input id="s-${k}" value="${esc(S[k]||'')}">`,
 row=x=>{const own=mail[x.id]==='admin@kelas.com',adm=x.role==='admin';return`<div class="m" data-s="${esc((x.username+' '+(mail[x.id]||'')).toLowerCase())}" style="margin-top:8px"><b>@${esc(x.username)}</b> ${bdg(x)}${x.banned?' <span class="tg bad">DIBATASI</span>':''} <span class="tm">${ago(x.last_seen)}</span><div class="tm">${esc(mail[x.id]||'')}</div>
 <input data-t="${x.id}" value="${esc(x.title)}" list="tl" maxlength="20">${own||x.id===me.id?'':`<div class="row">${ow?`<button class="btn" data-role="${x.id}:${adm?'member':'admin'}">${adm?'Cabut admin':'Jadikan admin'}</button>`:''}<button class="btn" data-ban="${x.id}:${x.banned?0:1}">${x.banned?'Buka batasan':'Batasi chat'}</button><button class="btn d" data-rm="${x.id}">Hapus akun</button></div>`}</div>`};
 b.innerHTML=`<div class="row"><div class="card">Member<h3>${a.count}</h3></div><div class="card">Pesan<h3>${c.count}</h3></div><div class="card">Online<h3>${on}</h3></div></div>
 <div class="card"><h3>Cek sistem</h3><small>Periksa tabel, fungsi, dan penyimpanan Supabase.</small><button class="btn p" id="hc-run" style="width:100%;margin-top:8px">Jalankan pemeriksaan</button><div id="hc-out"></div></div>
 <div class="card"><h3>Banner</h3><small>Hanya admin yang bisa mengganti atau menghapus. Video MP4/WebM atau gambar, maks 50 MB.</small><input type="file" id="bn-f" accept="video/mp4,video/webm,image/*"><div class="row"><button class="btn p" id="bn-up">Ganti banner</button><button class="btn d" id="bn-rs">Kembalikan banner awal</button></div></div>
 <div class="card"><h3>Pengaturan situs</h3>${s('channel','Link channel WhatsApp (https://...)')}${s('admin_wa','Nomor admin (628...)')}${s('ig','Instagram (tanpa @)')}${s('info','Informasi / pengumuman di banner')}
 <button class="btn p" id="s-save" style="width:100%;margin-top:8px">Simpan pengaturan</button><button class="btn d" id="s-clear" style="width:100%;margin-top:8px">Bersihkan chat global</button></div>
 <div class="card"><h3>Member</h3><input id="mq" placeholder="Cari member..." autocomplete="off"><datalist id="tl"><option>Member<option>VIP<option>Moderator<option>Legend<option>Owner</datalist>${us.map(row).join('')}</div>
 <div class="card"><h3>Aktivitas terbaru</h3><button class="btn d" id="ac-clr" style="width:100%;margin:6px 0">Hapus semua aktivitas</button>${(ac.data||[]).map(x=>`<div class="act"><span><b>${esc(x.username||'?')}</b> ${esc(AL[x.action]||x.action)} ${esc(x.detail||'')}<br><span class="tm">${new Date(x.created_at).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span></span><button class="btn d x" data-ad="${x.id}">hapus</button></div>`).join('')||(ac.error?'<span class="tm">'+esc(ac.error.message)+' (jalankan setup.sql terbaru)</span>':'<span class="tm">Belum ada aktivitas</span>')}</div>`;
 $('#mq').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#ad .m[data-s]').forEach(r=>r.hidden=!r.dataset.s.includes(q))};$('#hc-run').onclick=healthCheck;
 b.onchange=async e=>{const id=e.target.dataset.t;if(!id)return;const{error}=await sb.from('profiles').update({title:e.target.value.trim()||'Member'}).eq('id',id);error?toast(error.message):toast('Title diubah')};
 b.onclick=async e=>{const t=e.target.closest('button');if(!t)return;const d=t.dataset;let r,ok;
  if(t.id==='bn-up')return bannerUp();if(t.id==='bn-rs')return bannerReset();
  if(t.id==='s-save'){if(!/^https:\/\//.test($('#s-channel').value.trim()))return toast('Link channel harus diawali https://');
   r=await sb.from('settings').upsert(['channel','admin_wa','ig','info'].map(k=>{const v=$('#s-'+k).value.trim();return{key:k,value:k==='admin_wa'?v.replace(/\D/g,''):k==='ig'?v.replace(/[^\w.]/g,''):v}}));
   if(!r.error){await loadS();await sb.rpc('log_event',{p_action:'settings',p_detail:'link dan info situs'})}ok='Pengaturan tersimpan'}
  else if(t.id==='s-clear'){if(!confirm('Hapus SEMUA pesan chat global?'))return;r=await sb.rpc('admin_clear_chat');ok='Chat dibersihkan'}
  else if(t.id==='ac-clr'){if(!confirm('Hapus semua catatan aktivitas?'))return;r=await sb.from('activity').delete().gt('id',0);ok='Aktivitas dihapus'}
  else if(d.ad){r=await sb.from('activity').delete().eq('id',d.ad);ok='Dihapus'}
  else if(d.role){const[i,x]=d.role.split(':');r=await sb.rpc('admin_set_role',{p_uid:i,p_role:x});ok='Role diubah'}
  else if(d.ban){const[i,x]=d.ban.split(':');r=await sb.rpc('admin_ban',{p_uid:i,p_flag:x==='1'});ok='Status diubah'}
  else if(d.rm){if(!confirm('Hapus akun ini beserta semua pesannya?'))return;r=await sb.rpc('admin_delete_user',{p_uid:d.rm});ok='Akun dihapus'}
  else return;
  r.error?toast(r.error.message):(toast(ok),renderAdmin())}}

/* Musik */
const IP='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',IA='<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',au=new Audio(),L=[{t:'ChronoXStar Theme',a:'ChronoXStar',u:'lagu.m4a'},{t:'ChronoXStar Mix',a:'ChronoXStar',u:'lagu2.mp3'}];let Q=L,qi=0,R=[];
const tr=(l,i,k)=>`<div class="m tr" data-l="${k}" data-i="${i}" style="margin-top:6px"><b>${esc(l[i].t)}</b><br><span class="tm">${esc(l[i].a)}</span></div>`;
function play(l,i){Q=l;qi=i;au.src=l[i].u;au.play().catch(()=>toast('Ketuk tombol putar'));ui()}
function ui(){const c=Q[qi],x=au.paused?IP:IA;document.body.classList.toggle('playing',!au.paused);$('#pt').textContent=c?c.t+' — '+c.a:'Putar lagu ChronoXStar';$('#pt2').textContent=c?c.t:'Pilih lagu';$('#pp').innerHTML=$('#sp').innerHTML=x}
au.onplay=au.onpause=ui;au.onended=()=>play(Q,(qi+1)%Q.length);
au.ontimeupdate=()=>{if(au.duration)$('#pr').value=au.currentTime/au.duration*100};
$('#pr').oninput=e=>{if(au.duration)au.currentTime=e.target.value/100*au.duration};
$('#pp').onclick=$('#sp').onclick=()=>au.src?(au.paused?au.play():au.pause()):play(L,0);
$('#nx').onclick=()=>play(Q,(qi+1)%Q.length);$('#pv').onclick=()=>play(Q,(qi-1+Q.length)%Q.length);
$('#st').onclick=()=>{au.pause();au.currentTime=0;ui()};
$('#ll').innerHTML=L.map((_,i)=>tr(L,i,'L')).join('');
document.addEventListener('click',e=>{const r=e.target.closest('.tr');if(r)play(r.dataset.l==='L'?L:R,+r.dataset.i)});
const jp=u=>new Promise((ok,no)=>{const n='cb'+Date.now(),s=document.createElement('script');window[n]=d=>{ok(d);s.remove();delete window[n]};s.onerror=()=>no();s.src=u+'&callback='+n;document.head.appendChild(s)});
$('#qb').onclick=async()=>{const q=$('#qs').value.trim();if(!q)return;$('#rl').textContent='Mencari…';
 try{const d=await jp('https://itunes.apple.com/search?media=music&entity=song&limit=15&term='+enc(q));R=d.results.filter(x=>x.previewUrl).map(x=>({t:x.trackName,a:x.artistName,u:x.previewUrl}));$('#rl').innerHTML=R.length?R.map((_,i)=>tr(R,i,'R')).join(''):'Tidak ada hasil'}catch{$('#rl').textContent='Gagal mencari, coba lagi'}};

/* Tools — API gratis, langsung dari browser (tanpa server/panel) */
const J=u=>fetch(u).then(r=>{if(!r.ok)throw Error('API error '+r.status);return r.json()});
const T={
 'Cuaca':{f:{kota:'Jakarta'},run:async v=>{const g=(await J('https://geocoding-api.open-meteo.com/v1/search?count=1&language=id&name='+enc(v.kota))).results?.[0];if(!g)return'Kota tidak ditemukan';
  const c=(await J(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`)).current;return`${g.name}, ${g.country}\nSuhu ${c.temperature_2m}°C | Kelembapan ${c.relative_humidity_2m}% | Angin ${c.wind_speed_10m} km/j`}},
 'Kurs':{f:{jumlah:'1',dari:'USD',ke:'IDR'},run:async v=>{const r=(await J('https://open.er-api.com/v6/latest/'+enc(v.dari.toUpperCase()))).rates,k=r?.[v.ke.toUpperCase()];return k?`${v.jumlah} ${v.dari.toUpperCase()} = ${(v.jumlah*k).toLocaleString('id-ID')} ${v.ke.toUpperCase()}`:'Mata uang tidak dikenal'}},
 'Jadwal Sholat':{f:{kota:'Jakarta'},run:async v=>{const t=(await J('https://api.aladhan.com/v1/timingsByCity?country=Indonesia&method=20&city='+enc(v.kota))).data.timings;return[['Subuh','Fajr'],['Dzuhur','Dhuhr'],['Ashar','Asr'],['Maghrib','Maghrib'],['Isya','Isha']].map(([n,k])=>n+': '+t[k]).join('\n')}},
 'Terjemah':{f:{teks:'Selamat pagi',dari:'id',ke:'en'},run:async v=>(await J(`https://api.mymemory.translated.net/get?q=${enc(v.teks)}&langpair=${enc(v.dari+'|'+v.ke)}`)).responseData.translatedText},
 'QR Code':{f:{teks:'https://whatsapp.com/channel/0029Vb9kIdD2f3ELjmdI5p3i'},run:async v=>({html:`<img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${enc(v.teks)}" width="240" height="240" alt="QR">`})}};
function calc(s){let i=0;const ws=()=>{while(s[i]===' ')i++},
 num=()=>{const m=/^\d*\.?\d+/.exec(s.slice(i));if(!m)throw Error('Ekspresi tidak valid');i+=m[0].length;return +m[0]},
 prim=()=>{ws();const c=s[i];if(c==='('){i++;const v=add();ws();if(s[i++]!==')')throw Error('Kurung tidak seimbang');return v}if(c==='-'){i++;return -prim()}if(c==='+'){i++;return prim()}return num()},
 pow=()=>{const v=prim();ws();if(s[i]==='^'){i++;return Math.pow(v,pow())}return v},
 mul=()=>{let v=pow();for(;;){ws();const c=s[i];if(c!=='*'&&c!=='/'&&c!=='%')return v;i++;const r=pow();v=c==='*'?v*r:c==='/'?v/r:v%r}},
 add=()=>{let v=mul();for(;;){ws();const c=s[i];if(c!=='+'&&c!=='-')return v;i++;const r=mul();v=c==='+'?v+r:v-r}};
 const r=add();ws();if(i<s.length)throw Error('Ekspresi tidak valid');return r}
const rnd=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n},hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''),X=(f,run)=>({f,run,u:1});
const MO={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'};
const UN={m:[1,'p'],km:[1e3,'p'],cm:[.01,'p'],mm:[.001,'p'],mil:[1609.344,'p'],kaki:[.3048,'p'],inci:[.0254,'p'],kg:[1,'b'],g:[.001,'b'],lb:[.45359237,'b'],oz:[.028349523,'b']};
Object.assign(T,{
 'Wikipedia':{f:{judul:'Indonesia'},run:async v=>{const r=await fetch('https://id.wikipedia.org/api/rest_v1/page/summary/'+enc(v.judul.replace(/ /g,'_')));if(!r.ok)return'Artikel tidak ditemukan';const j=await r.json();return j.title+'\n\n'+j.extract}},
 'Cek IP':{f:{},run:async()=>'IP publik kamu: '+(await J('https://api.ipify.org?format=json')).ip},
 'DNS Lookup':{f:{domain:'example.com',tipe:['A','AAAA','MX','TXT','NS','CNAME']},run:async v=>((await J('https://dns.google/resolve?name='+enc(v.domain)+'&type='+v.tipe)).Answer||[]).map(a=>a.data).join('\n')||'Tidak ada data'},
 'Password':X({panjang:'16',simbol:['ya','tidak']},v=>{const n=Math.min(Math.max(+v.panjang||16,6),64),s='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'+(v.simbol==='ya'?'!@#$%^&*()-_=+':'');return Array.from({length:n},()=>s[rnd(s.length)]).join('')}),
 'Base64':X({teks:'Halo dunia',mode:['encode','decode']},v=>v.mode==='encode'?btoa(String.fromCharCode(...new TextEncoder().encode(v.teks))):new TextDecoder().decode(Uint8Array.from(atob(v.teks),c=>c.charCodeAt(0)))),
 'URL Encode':X({teks:'halo dunia & kawan',mode:['encode','decode']},v=>v.mode==='encode'?encodeURIComponent(v.teks):decodeURIComponent(v.teks)),
 'JSON Format':X({json:'{"a":1,"b":[1,2]}'},v=>JSON.stringify(JSON.parse(v.json),null,2)),
 'Hitung Kata':X({teks:'Tulis teks di sini'},v=>{const t=v.teks;return`Kata: ${(t.match(/\S+/g)||[]).length}\nKarakter: ${t.length}\nTanpa spasi: ${t.replace(/\s/g,'').length}\nBaris: ${t.split('\n').length}`}),
 'Ubah Huruf':X({teks:'halo dunia',mode:['BESAR','kecil','Judul','Kalimat']},v=>{const t=v.teks;return v.mode==='BESAR'?t.toUpperCase():v.mode==='kecil'?t.toLowerCase():v.mode==='Judul'?t.toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase()):t.toLowerCase().replace(/(^\s*|[.!?]\s+)(\S)/g,(m,a,c)=>a+c.toUpperCase())}),
 'Hash':X({teks:'ChronoXStar',algoritma:['SHA-256','SHA-1','SHA-512']},async v=>hex(await crypto.subtle.digest(v.algoritma,new TextEncoder().encode(v.teks)))),
 'UUID':X({jumlah:'3'},v=>Array.from({length:Math.min(+v.jumlah||1,20)},()=>crypto.randomUUID()).join('\n')),
 'Angka Acak':X({min:'1',max:'100',jumlah:'5'},v=>{const a=+v.min,b=+v.max;if(!(b>=a))throw Error('max harus lebih besar dari min');return Array.from({length:Math.min(+v.jumlah||1,50)},()=>a+rnd(b-a+1)).join(', ')}),
 'Warna':X({hex:'#ff2e48'},v=>{const x=v.hex.replace('#','');if(!/^[0-9a-f]{6}$/i.test(x))throw Error('Format: #RRGGBB');const r=parseInt(x.slice(0,2),16),g=parseInt(x.slice(2,4),16),bl=parseInt(x.slice(4,6),16),rr=r/255,gg=g/255,bb=bl/255,mx=Math.max(rr,gg,bb),mn=Math.min(rr,gg,bb),l=(mx+mn)/2,d=mx-mn;let hh=0,ss=0;
  if(d){ss=d/(1-Math.abs(2*l-1));hh=mx===rr?((gg-bb)/d)%6:mx===gg?(bb-rr)/d+2:(rr-gg)/d+4;hh=Math.round(hh*60);if(hh<0)hh+=360}
  return`RGB: ${r}, ${g}, ${bl}\nHSL: ${hh}, ${Math.round(ss*100)}%, ${Math.round(l*100)}%`}),
 'Suhu':X({nilai:'36.6',dari:['C','F','K']},v=>{const n=+v.nilai,c=v.dari==='C'?n:v.dari==='F'?(n-32)*5/9:n-273.15;return`Celsius: ${c.toFixed(2)}\nFahrenheit: ${(c*9/5+32).toFixed(2)}\nKelvin: ${(c+273.15).toFixed(2)}`}),
 'Satuan':X({nilai:'1',dari:'km',ke:'mil'},v=>{const a=UN[v.dari],b=UN[v.ke];if(!a||!b||a[1]!==b[1])throw Error('Satuan tidak cocok. Panjang: m km cm mm mil kaki inci. Berat: kg g lb oz');return`${v.nilai} ${v.dari} = ${(v.nilai*a[0]/b[0]).toLocaleString('id-ID',{maximumFractionDigits:6})} ${v.ke}`}),
 'BMI':X({berat:'60',tinggi:'165'},v=>{const m=v.tinggi/100,i=v.berat/m/m;return`BMI: ${i.toFixed(1)} (${i<18.5?'Kurus':i<25?'Normal':i<30?'Gemuk':'Obesitas'})`}),
 'Umur':X({lahir:'2000-01-31'},v=>{const d=new Date(v.lahir),n=new Date();if(isNaN(d))throw Error('Format: YYYY-MM-DD');let y=n.getFullYear()-d.getFullYear(),m=n.getMonth()-d.getMonth(),h=n.getDate()-d.getDate();if(h<0){m--;h+=new Date(n.getFullYear(),n.getMonth(),0).getDate()}if(m<0){y--;m+=12}return`${y} tahun ${m} bulan ${h} hari\nTotal: ${Math.floor((n-d)/864e5)} hari`}),
 'Diskon':X({harga:'100000',diskon:'20'},v=>{const p=+v.harga,d=p*v.diskon/100;return`Potongan: ${d.toLocaleString('id-ID')}\nBayar: ${(p-d).toLocaleString('id-ID')}`}),
 'Morse':X({teks:'SOS',mode:['teks ke morse','morse ke teks']},v=>{if(v.mode==='teks ke morse')return[...v.teks.toUpperCase()].map(c=>c===' '?'/':MO[c]||'?').join(' ');const r={};for(const k in MO)r[MO[k]]=k;return v.teks.trim().split(/\s+/).map(c=>c==='/'?' ':r[c]||'?').join('')}),
 'Caesar':X({teks:'Halo Dunia',geser:'13'},v=>{const n=((+v.geser%26)+26)%26;return v.teks.replace(/[a-z]/gi,c=>{const b=c<'a'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+n)%26+b)})}),
 'Timestamp':X({nilai:String(Date.now()/1000|0)},v=>{const s=v.nilai.trim(),d=/^\d+$/.test(s)?new Date(s.length>11?+s:s*1000):new Date(s);if(isNaN(d))throw Error('Isi epoch atau tanggal');return`Epoch (detik): ${Math.floor(d/1000)}\nISO: ${d.toISOString()}\nLokal: ${d.toLocaleString('id-ID')}`}),
 'Slug':X({teks:'Judul Artikel Keren!'},v=>v.teks.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')),
 'Kalkulator':X({ekspresi:'(12+8)*3/2'},v=>String(calc(v.ekspresi.replace(/,/g,'.')))),
 'Lorem Ipsum':X({kata:'30'},v=>{const w='lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');return Array.from({length:Math.min(+v.kata||20,300)},(_,i)=>w[i%w.length]).join(' ')})
});
const TC={Hiburan:['Cari Anime','Cari Komik','Jadwal Anime','Unduhan Legal'],Info:['Cuaca','Jadwal Sholat','Info Gempa','Libur Nasional','Kurs','Harga Kripto','Info Negara','Wikipedia','Terjemah'],Web:['Cek Domain','DNS Lookup','Cek IP','QR Code'],Teks:['Base64','URL Encode','JSON Format','Hitung Kata','Ubah Huruf','Morse','Caesar','Slug','Lorem Ipsum'],Hitung:['Kalkulator','Satuan','Suhu','BMI','Diskon','Angka Acak','Warna','Umur','Timestamp'],Aman:['Password','Hash','UUID']};
const TD={'Cuaca':'Suhu dan angin kota','Kurs':'Konversi mata uang','Jadwal Sholat':'Waktu sholat kota','Terjemah':'Terjemahkan teks','Wikipedia':'Ringkasan artikel','Cek IP':'IP publik kamu','DNS Lookup':'Cek data domain','QR Code':'Buat kode QR','Base64':'Encode dan decode','URL Encode':'Ubah teks untuk URL','JSON Format':'Rapikan JSON','Hitung Kata':'Kata dan karakter','Ubah Huruf':'Besar, kecil, judul','Morse':'Teks dan kode morse','Caesar':'Sandi geser huruf','Slug':'Teks jadi slug URL','Lorem Ipsum':'Teks contoh','Kalkulator':'Hitung ekspresi','Satuan':'Panjang dan berat','Suhu':'Celsius, Fahrenheit','BMI':'Indeks massa tubuh','Diskon':'Hitung potongan','Angka Acak':'Acak yang aman','Warna':'HEX ke RGB dan HSL','Umur':'Hitung umur','Timestamp':'Epoch dan tanggal','Password':'Password kuat acak','Hash':'SHA-256, SHA-1, SHA-512','UUID':'ID unik acak'};
const TI={API:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',Teks:'<path d="M5 6h14M12 6v13M8 19h8"/>',Hitung:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>',Aman:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'};
const ANI=async(q,v)=>{const r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query:q,variables:v})});if(!r.ok)throw Error('AniList error '+r.status);const j=await r.json();if(j.errors)throw Error(j.errors[0].message);return j.data};
const MQ='query($s:String,$t:MediaType,$c:CountryCode,$o:[MediaSort]){Page(perPage:6){media(search:$s,type:$t,countryOfOrigin:$c,sort:$o,isAdult:false){id siteUrl format status episodes chapters averageScore genres description(asHtml:false) title{romaji english} coverImage{large} externalLinks{site url type}}}}';
const SQ='query($a:Int,$b:Int){Page(perPage:50){airingSchedules(airingAt_greater:$a,airingAt_lesser:$b,sort:TIME){airingAt episode media{siteUrl countryOfOrigin isAdult title{romaji english}}}}}';
const clean=s=>(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(),okh=u=>/^https:\/\//.test(u||'');
const media=async(v,type,map)=>{const d=await ANI(MQ,{s:v.judul||null,t:type,c:map[v.jenis]||null,o:[v.judul?'SEARCH_MATCH':'POPULARITY_DESC']}),L=d.Page.media;if(!L.length)return'Tidak ditemukan.';
 return{html:L.map(m=>{const ln=[...(m.externalLinks||[]).filter(x=>x.type==='STREAMING'||x.type==='INFO').slice(0,3),{site:'AniList',url:m.siteUrl}].filter(x=>okh(x.url)).map(x=>`<a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.site)}</a>`).join('');
  return`<div class="ani">${/^https:\/\/s\d*\.anilist\.co\//.test(m.coverImage?.large||'')?`<img src="${esc(m.coverImage.large)}" alt="">`:''}<div><b>${esc(m.title.english||m.title.romaji)}</b><br><small>${esc([m.format,m.status,m.episodes?m.episodes+' ep':m.chapters?m.chapters+' ch':'',m.averageScore?'skor '+m.averageScore:''].filter(Boolean).join(' | '))}</small><br><span class="tm">${esc((m.genres||[]).slice(0,4).join(', '))}</span><p>${esc(clean(m.description).slice(0,220))}</p>${ln}</div></div>`}).join('')+'<small>Sumber: AniList. Tautan menuju platform resmi.</small>'}};
const doh=async(n,t)=>((await J('https://dns.google/resolve?name='+enc(n)+'&type='+t)).Answer||[]).map(a=>a.data);
Object.assign(T,{
 'Cari Anime':{f:{judul:'',jenis:['Semua','Donghua (China)','Anime (Jepang)']},run:v=>media(v,'ANIME',{'Donghua (China)':'CN','Anime (Jepang)':'JP'})},
 'Cari Komik':{f:{judul:'',jenis:['Semua','Manga (Jepang)','Manhwa (Korea)','Manhua (China)']},run:v=>media(v,'MANGA',{'Manga (Jepang)':'JP','Manhwa (Korea)':'KR','Manhua (China)':'CN'})},
 'Jadwal Anime':{f:{tampilkan:['Semua','Donghua (China)','Anime (Jepang)']},run:async v=>{const n=Math.floor(Date.now()/1000),c={'Donghua (China)':'CN','Anime (Jepang)':'JP'}[v.tampilkan],d=await ANI(SQ,{a:n,b:n+86400}),
  L=d.Page.airingSchedules.filter(x=>!x.media.isAdult&&(!c||x.media.countryOfOrigin===c));if(!L.length)return'Tidak ada jadwal tayang 24 jam ke depan.';
  return L.map(x=>new Date(x.airingAt*1000).toLocaleString('id-ID',{weekday:'short',hour:'2-digit',minute:'2-digit'})+'  '+(x.media.title.english||x.media.title.romaji)+'  (eps '+x.episode+')').join('\n')+'\n\nSumber: AniList. Waktu sesuai zona perangkatmu.'}},
 'Unduhan Legal':{f:{kata:'beethoven',jenis:['Semua','Audio','Video','Buku/Teks']},run:async v=>{const mt={'Audio':'audio','Video':'movies','Buku/Teks':'texts'}[v.jenis],q='('+v.kata.replace(/[()"\\:]/g,' ')+') AND licenseurl:(*creativecommons.org* OR *publicdomain*)'+(mt?' AND mediatype:'+mt:''),
  url=b=>b+'/advancedsearch.php?q='+enc(q)+'&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=mediatype&rows=12&sort%5B%5D=downloads+desc&output=json';let j;try{j=await J(url('https://archive.org'))}catch{j=await J(url('https://cors.archive.org'))}
  const L=j.response.docs;if(!L.length)return'Tidak ada hasil berlisensi terbuka untuk kata itu.';
  return{html:L.map(x=>`<div class="ani"><div><b>${esc(x.title)}</b><br><small>${esc(x.mediatype)}</small><br><a class="btn" href="https://archive.org/details/${enc(x.identifier)}" target="_blank" rel="noopener noreferrer">Buka</a><a class="btn p" href="https://archive.org/download/${enc(x.identifier)}" target="_blank" rel="noopener noreferrer">Unduh</a></div></div>`).join('')+'<small>Sumber: Internet Archive. Hanya konten berlisensi terbuka atau domain publik.</small>'}}},
 'Cek Domain':{f:{domain:'example.com'},run:async v=>{const d=v.domain.toLowerCase().replace(/^https?:\/\//,'').replace(/[\/?#].*$/,'').replace(/^www\./,'');if(!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d))throw Error('Format domain tidak valid, contoh: example.com');
  const[a,ns,mx,tx,dm]=await Promise.all([doh(d,'A'),doh(d,'NS'),doh(d,'MX'),doh(d,'TXT'),doh('_dmarc.'+d,'TXT')]);
  const L=['Domain: '+d,'IP: '+(a.join(', ')||'tidak ditemukan'),'Nameserver: '+(ns.join(', ')||'-'),'Email (MX): '+(mx.join(', ')||'-'),'SPF: '+(tx.some(x=>/v=spf1/i.test(x))?'ada':'tidak ada'),'DMARC: '+(dm.some(x=>/v=DMARC1/i.test(x))?'ada':'tidak ada')];
  if(a[0]){try{const g=await J('https://ipwho.is/'+a[0]);if(g.success!==false)L.push('Lokasi server: '+[g.city,g.country].filter(Boolean).join(', '),'Penyedia: '+(g.connection?.isp||g.connection?.org||'-'))}catch{}}
  return L.join('\n')}},
 'Info Gempa':{f:{jenis:['Terbaru','M5+ terkini','Dirasakan']},run:async v=>{const u={'Terbaru':'autogempa','M5+ terkini':'gempaterkini','Dirasakan':'gempadirasakan'}[v.jenis],g=[].concat((await J('https://data.bmkg.go.id/DataMKG/TEWS/'+u+'.json')).Infogempa.gempa).slice(0,10);
  return g.map(x=>`M${x.Magnitude} | ${x.Tanggal} ${x.Jam}\n${x.Wilayah}\nKedalaman ${x.Kedalaman}${x.Potensi?' | '+x.Potensi:''}${x.Dirasakan?'\nDirasakan: '+x.Dirasakan:''}`).join('\n\n')+'\n\nSumber: BMKG'}},
 'Libur Nasional':{f:{tahun:String(new Date().getFullYear())},run:async v=>{if(!/^\d{4}$/.test(v.tahun))throw Error('Isi tahun 4 digit');const L=await J('https://date.nager.at/api/v3/PublicHolidays/'+v.tahun+'/ID');
  return L.map(x=>new Date(x.date+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})+'  '+x.localName).join('\n')+'\n\nSumber: Nager.Date'}},
 'Harga Kripto':{f:{koin:'bitcoin,ethereum,solana',mata_uang:['idr','usd']},run:async v=>{const c=v.mata_uang,d=await J('https://api.coingecko.com/api/v3/simple/price?include_24hr_change=true&ids='+enc(v.koin.toLowerCase().replace(/\s/g,''))+'&vs_currencies='+c);
  const k=Object.keys(d);if(!k.length)return'Koin tidak ditemukan (pakai id CoinGecko, contoh: bitcoin).';return k.map(n=>n+': '+(c==='idr'?'Rp ':'$ ')+d[n][c].toLocaleString('id-ID')+(d[n][c+'_24h_change']!=null?'  ('+d[n][c+'_24h_change'].toFixed(2)+'% / 24 jam)':'')).join('\n')+'\n\nSumber: CoinGecko (bukan saran investasi)'}},
 'Info Negara':{f:{negara:'indonesia'},run:async v=>{const L=await J('https://restcountries.com/v3.1/name/'+enc(v.negara)+'?fields=name,capital,population,area,region,subregion,languages,currencies');
  return L.slice(0,3).map(c=>c.name.common+'\nIbu kota: '+(c.capital||[]).join(', ')+'\nWilayah: '+[c.region,c.subregion].filter(Boolean).join(', ')+'\nPenduduk: '+c.population.toLocaleString('id-ID')+'\nLuas: '+c.area.toLocaleString('id-ID')+' km2\nBahasa: '+Object.values(c.languages||{}).join(', ')+'\nMata uang: '+Object.values(c.currencies||{}).map(x=>x.name).join(', ')).join('\n\n')}}
});
Object.assign(TD,{'Cari Anime':'Anime dan donghua, link resmi','Cari Komik':'Manga, manhwa, manhua','Jadwal Anime':'Tayang 24 jam ke depan','Unduhan Legal':'Audio, video, buku bebas lisensi','Cek Domain':'IP, nameserver, SPF, DMARC','Info Gempa':'Data resmi BMKG','Libur Nasional':'Hari libur Indonesia','Harga Kripto':'Harga koin terkini','Info Negara':'Ibu kota, penduduk, bahasa'});
TI.Hiburan='<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>';TI.Info='<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>';TI.Web=TI.API;
let tcat='Semua';
function toolGrid(){const q=$('#tq').value.toLowerCase().trim();let h='';
 for(const c in TC)for(const n of TC[c])if((tcat==='Semua'||tcat===c)&&(n+' '+TD[n]).toLowerCase().includes(q))h+=`<button class="gl fc tt" data-n="${n}"><span class="ico"><svg viewBox="0 0 24 24">${TI[c]}</svg></span><small>${c}</small><b>${n}</b><span class="td">${TD[n]}</span></button>`;
 $('#tgrid').innerHTML=h||'<div class="card" style="grid-column:1/-1">Tidak ada tools yang cocok</div>'}
$('#tcat').innerHTML=['Semua',...Object.keys(TC)].map(c=>`<button class="btn${c==='Semua'?' on':''}" data-c="${c}">${c}</button>`).join('');
$('#tcat').onclick=e=>{const c=e.target.dataset.c;if(!c)return;tcat=c;document.querySelectorAll('#tcat .btn').forEach(b=>b.classList.toggle('on',b.dataset.c===c));toolGrid()};
$('#tq').oninput=toolGrid;$('#tgrid').onclick=e=>{const t=e.target.closest('[data-n]');if(t)tool(t.dataset.n)};
$('#tback').onclick=()=>{$('#tl-run').hidden=true;$('#tl-list').hidden=false};
function tool(n){const t=T[n];$('#tl-list').hidden=true;$('#tl-run').hidden=false;
 $('#tf').innerHTML=`<h3>${esc(n)}</h3><small>${esc(TD[n]||'')}</small>`+Object.entries(t.f).map(([k,d])=>{const l=k[0].toUpperCase()+k.slice(1);return Array.isArray(d)?`<label>${l}</label><select id="t-${k}">${d.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`:/^(teks|json)$/.test(k)?`<label>${l}</label><textarea id="t-${k}" rows="4">${esc(d)}</textarea>`:`<label>${l}</label><input id="t-${k}" value="${esc(d)}">`}).join('')+'<button class="btn p" id="tr" style="width:100%;margin-top:10px">Jalankan</button><div id="to"></div>';
 const run=async()=>{const v={};for(const k in t.f)v[k]=$('#t-'+k).value.trim();const o=$('#to'),b=$('#tr');o.innerHTML='<div class="out">Memuat...</div>';b.classList.add('ld');
  try{const r=await t.run(v);if(typeof r==='string'){o.innerHTML='<div class="out"></div><button class="btn" id="tcp">Salin hasil</button>';o.firstChild.textContent=r;$('#tcp').onclick=async()=>{try{await navigator.clipboard.writeText(r);toast('Disalin')}catch{toast('Gagal menyalin')}}}else o.innerHTML='<div class="out">'+r.html+'</div>'}
  catch(e){o.innerHTML='<div class="out"></div>';o.firstChild.textContent='Gagal: '+e.message}b.classList.remove('ld')};
 $('#tr').onclick=run;$('#tf').querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')run()})}
toolGrid();

/* Mulai */
const SH='<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
bdg=p=>p?.role==='admin'?`<span class="tg adm">${SH}ADMIN</span>`:p?.title?`<span class="tg">${esc(p.title)}</span>`:'',
wait=ms=>new Promise(r=>setTimeout(r,ms)),UPSV='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',D=s=>$(s)||{style:{},classList:{add(){}}},
PH=['','Chat global realtime','Musik dan tools gratis','Dikelola admin terpercaya'];
function tick(){const t=(S.info+'   //   CHRONOXSTAR   //   ').repeat(3);$('#tk').textContent=t+t;PH[0]=S.info}
function scr(e,t){const k='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&';let i=0;e.dataset.t=t;const iv=setInterval(()=>{e.textContent=[...t].map((c,n)=>n<i?c:k[Math.random()*k.length|0]).join('');if((i+=.4)>t.length){clearInterval(iv);e.textContent=t}},40)}
function typer(){const e=$('#ty');let i=0,j=0,del=false;(function f(){const s=PH[i]||PH[1];e.textContent=s.slice(0,j);
 if(!del){if(j<s.length){j++;return setTimeout(f,65)}del=true;return setTimeout(f,1500)}
 if(j>0){j--;return setTimeout(f,28)}
 del=false;i=(i+1)%PH.length;setTimeout(f,300)})()}
function typeIn(e,t){clearInterval(typeIn.i);let i=0;e.textContent='';if(!t)return;typeIn.i=setInterval(()=>{e.textContent=t.slice(0,++i);if(i>=t.length)clearInterval(typeIn.i)},45)}
async function chatPrev(){const e=$('#cp');if(!me){e.textContent='Masuk untuk melihat chat';return}
 const{data}=await sb.from('messages').select('content,profiles(username)').order('id',{ascending:false}).limit(1),m=data?.[0];
 e.textContent=m?(m.profiles?.username||'user')+': '+m.content:'Belum ada pesan, mulai obrolan'}
function homeUser(){$('#un').textContent=me?pf?.username||'akun':'Tamu';$('#ub').innerHTML=bdg(pf);$('#uav').innerHTML=pf&&pf.avatar_url&&pf.avatar_url.startsWith(SU+'avatars/')?`<img class="pa big" src="${esc(pf.avatar_url)}" alt="">`:UPSV;
 const s=$('#us');s.textContent=me?isAd()?'ADMIN':'ONLINE':'GUEST';s.className=me?'g':'';
 $('#uc').classList.toggle('on',!!me);$('#uc').classList.toggle('adm',isAd());typeIn($('#uacc'),isAd()?'AKSES ADMIN AKTIF':'');chatPrev()}
const B={set(p,m){D('#bbar').style.width=p+'%';D('#bpc').textContent=p+'%';if(m)D('#bmsg').textContent=m},ok(n){D('#k'+n).classList.add('ok')},
 end(){const b=$('#boot');if(!b||B.d)return;B.d=1;b.classList.add('off');setTimeout(()=>b.remove(),800);scr($('#hw'),'CHRONOXSTAR');typer()}};
(async()=>{authMode(false);const t0=Date.now(),https=location.protocol==='https:';
 setInterval(()=>$('#clk').textContent=new Date().toLocaleTimeString('id-ID',{hour12:false}),1000);
 $('#bskip').onclick=()=>B.end();$('#uc').onclick=()=>me?go('me'):$('#am').showModal();
 $('#bpr').textContent=https?'HTTPS':'LOKAL';$('#bnet').textContent=navigator.onLine?'ONLINE':'OFFLINE';$('#bsec').textContent=https?'KONEKSI AMAN':'MODE LOKAL';
 try{B.set(10,'memeriksa koneksi...');await wait(400);if(https)B.ok(1);if(navigator.onLine)B.ok(2);
  B.set(35,'memuat pengaturan...');await loadS();await loadInfo();B.ok(3);
  B.set(65,'memeriksa sesi login...');const{data:{session}}=await sb.auth.getSession();await setUser(session?.user);B.ok(4);
  B.set(88,'menyiapkan antarmuka...');
  sb.auth.onAuthStateChange((_e,s)=>{if((s?.user?.id||null)===(me?.id||null))return;setTimeout(async()=>{await setUser(s?.user);go(cur==='admin'&&!isAd()?'home':cur)},0)});sb.channel('info').on('postgres_changes',{event:'*',schema:'public',table:'info_posts'},()=>loadInfo()).subscribe()}
 catch(e){D('#bmsg').textContent='gagal terhubung, mode terbatas'}
 go('home');await wait(Math.max(0,2600-(Date.now()-t0)));B.set(100,'sistem siap');D('#bst').textContent='ready';await wait(500);B.end()})();
/* Deteksi perangkat + penyesuaian desktop */
const DEV=(()=>{const ua=navigator.userAgent,d=navigator.userAgentData,
 os=d?.platform||(/Windows/.test(ua)?'Windows':/Android/.test(ua)?'Android':/iPhone|iPad|iPod/.test(ua)?'iOS':/Mac/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'Perangkat'),
 br=/Edg\//.test(ua)?'Edge':/OPR\//.test(ua)?'Opera':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Browser';
 return{os,br,touch:matchMedia('(pointer:coarse)').matches,get type(){return innerWidth>=900?'desktop':innerWidth>=600?'tablet':'mobile'},get info(){return os+' / '+br+' / '+this.type}}})();
const setDev=()=>{document.documentElement.dataset.dev=DEV.type;document.documentElement.dataset.input=DEV.touch?'touch':'mouse'};
addEventListener('resize',setDev);setDev();
addEventListener('keydown',e=>{if(DEV.touch||e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)||document.querySelector('dialog[open]'))return;
 if(e.key==='/'){e.preventDefault();({chat:'#ci',tools:'#tq',music:'#qs'}[cur]&&$({chat:'#ci',tools:'#tq',music:'#qs'}[cur]))?.focus()}
 const m={1:'home',2:'chat',3:'info',4:'tools',5:'me'}[e.key];if(m)go(m)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(cur==='chat'&&me)loadMsgs();loadInfo()});
setInterval(()=>{if(!document.hidden&&cur==='chat'&&me&&ch)pollMsgs()},8000);
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(a==='login')$('#am').showModal();else if(a==='close-am')$('#am').close();else if(a==='close-pm')$('#pm').close()});
/* UX: efek tekan + cahaya, mode mengetik, kontrol media */
document.addEventListener('pointerdown',e=>{const t=e.target.closest('.btn,.fc,.wide,nav button,.tr,.skip');if(!t||t.disabled)return;
 const r=t.getBoundingClientRect(),s=Math.max(r.width,r.height)*2,d=document.createElement('i');d.className='rip';
 d.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;t.appendChild(d);setTimeout(()=>d.remove(),700);DEV.touch&&navigator.vibrate?.(8)});
const isT=x=>/^(INPUT|TEXTAREA)$/.test(x?.tagName)&&!/^(range|file)$/.test(x.type);
const kb=()=>document.body.classList.toggle('typing',isT(document.activeElement)&&DEV.touch&&!!window.visualViewport&&visualViewport.height<innerHeight*.8);
window.visualViewport?.addEventListener('resize',kb);document.addEventListener('focusin',()=>setTimeout(kb,350));document.addEventListener('focusout',()=>setTimeout(kb,200));
for(const id of['#am','#pm'])$(id).addEventListener('click',e=>{const d=e.currentTarget,r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()});
if('mediaSession' in navigator){const ms=navigator.mediaSession;ms.setActionHandler('play',()=>au.play());ms.setActionHandler('pause',()=>au.pause());ms.setActionHandler('nexttrack',()=>$('#nx').click());ms.setActionHandler('previoustrack',()=>$('#pv').click());
 au.addEventListener('play',()=>{const c=Q[qi];if(c)ms.metadata=new MediaMetadata({title:c.t,artist:c.a})})}
(()=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const c=$('#fx'),x=c.getContext('2d'),p=[];let w,h;const rs=()=>{w=c.width=innerWidth;h=c.height=innerHeight};rs();addEventListener('resize',rs);
for(let i=0;i<30;i++)p.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:1+Math.random()*3,s:.25+Math.random()*.6,d:Math.random()*6});
(function f(){x.clearRect(0,0,w,h);for(const q of p){q.y+=q.s;q.x+=Math.sin(q.d+=.01)*.4;if(q.y>h+5){q.y=-5;q.x=Math.random()*w}x.beginPath();x.fillStyle=(q.r>2.2?'rgba(255,46,72,':'rgba(90,170,255,')+(.2+q.r/9)+')';x.arc(q.x,q.y,q.r,0,7);x.fill()}requestAnimationFrame(f)})()})();
}
if(window.supabase)start();
else{const s=document.createElement('script');s.src='https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';s.onload=start;
 s.onerror=()=>{const b=document.getElementById('boot');if(b)b.remove();document.body.insertAdjacentHTML('afterbegin','<div class="card" style="margin:20px">Gagal memuat Supabase. Periksa koneksi internet lalu muat ulang halaman.</div>')};document.head.appendChild(s)}
})();
