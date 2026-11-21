/* Pelindung + diagnosa. Jalan paling awal. */
(function(){
 if(top!==self){try{top.location=self.location}catch(e){document.documentElement.remove();return}}
 var show=function(m){var n=document.getElementById('nojs');
  if(n){var s=n.querySelector('span');if(s)s.textContent=m;return}
  var d=document.getElementById('cxerr');
  if(!d){d=document.createElement('div');d.id='cxerr';d.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483001;background:#400;color:#fff;font:12px system-ui;padding:10px;border-radius:10px';document.body.appendChild(d)}
  d.textContent='Kesalahan: '+m;clearTimeout(d._t);d._t=setTimeout(function(){d.remove()},12000)};
 addEventListener('error',function(e){if(e.message&&!/ResizeObserver|Script error/.test(e.message))show(e.message+(e.filename?' ('+e.filename.split('/').pop()+':'+e.lineno+')':''))});
 addEventListener('unhandledrejection',function(e){var r=e.reason;show(String(r&&r.message||r))});
 setTimeout(async function(){var n=document.getElementById('nojs');if(!n)return;var out=[];
  for(var f of['app.js','app.css','config.js']){try{var r=await fetch(f,{method:'HEAD',cache:'no-store'});out.push(f+': '+(r.ok?'ada':'HILANG ('+r.status+')'))}catch(e){out.push(f+': gagal dicek')}}
  n.querySelector('small').textContent=out.join(' | ')+'. Perbaiki lalu muat ulang halaman.'},6000);
})();
