(function(){'use strict';
const APP_VERSION='3.0-general-2'; const BATTLE_PRESET_VERSION = window.GuildBattlePresets.PRESET_VERSION; const DEFAULT_GAS_URL='https://script.google.com/macros/s/AKfycbzX6hTXf6HWtpVarXymnKc2xGA6BhkmIhXMu4QIweqHJlkADWLlHDIM0daJJuXXJgjpLA/exec'; const KEY='otakubaGuildApp.v1.complete'; const OLD='otakubaGuildApp.v2.masterMenu';
const CATS={food:'フード',drink:'ドリンク',alcohol:'アルコール',dessert:'デザート',event:'イベント'};
const CAT_ICONS={food:'🍖',drink:'🥤',alcohol:'🍺',dessert:'🍰',event:'🎉'};
const DEFAULT_PRODUCTS=[
{id:uid(),cat:'food',name:'唐揚げ',price:600,emoji:'🍗',desc:'ギルド定番のフード。',image:''},{id:uid(),cat:'food',name:'ポテト',price:500,emoji:'🍟',desc:'みんなでつまめる。',image:''},{id:uid(),cat:'drink',name:'コーラ',price:400,emoji:'🥤',desc:'ソフトドリンク。',image:''},{id:uid(),cat:'drink',name:'メロンソーダ',price:400,emoji:'🥤',desc:'緑の回復薬。',image:''},{id:uid(),cat:'alcohol',name:'生ビール',price:600,emoji:'🍺',desc:'酒場の基本。',image:''},{id:uid(),cat:'alcohol',name:'ハイボール',price:550,emoji:'🥃',desc:'強炭酸。',image:''},{id:uid(),cat:'dessert',name:'アイス',price:350,emoji:'🍨',desc:'食後の甘味。',image:''},{id:uid(),cat:'event',name:'本日の限定',price:700,emoji:'🎉',desc:'イベントメニュー。',image:''}];
function uid(){return 'id'+Math.random().toString(36).slice(2,9)+Date.now().toString(36)}
function defaultEnemies(){return window.GuildBattlePresets.defaultEnemies()}
function defaults(){return {products:DEFAULT_PRODUCTS,orders:[],activeBill:[],sales:[],customers:[],settings:{notice:{enabled:false,title:'本日のお知らせ',body:'',position:'top'},gasUrl:'',notifyOn:true,currentEnemyIndex:0,enemies:defaultEnemies(),design:{bg:'background.jpg',bgm:''}},currentCustomer:''}}
function migrate(o){
  const d=defaults();
  if(!o||typeof o!=="object") return d;
  o.products=Array.isArray(o.products)&&o.products.length?o.products:d.products;
  o.orders=Array.isArray(o.orders)?o.orders:[];
  o.activeBill=Array.isArray(o.activeBill)?o.activeBill:[];
  o.sales=Array.isArray(o.sales)?o.sales:[];
  o.customers=Array.isArray(o.customers)?o.customers:[];
  o.customers.forEach(c=>{if(c&&!c.id)c.id=uid()});
  o.settings=o.settings||{};
  o.settings.notice=o.settings.notice||d.settings.notice;
  if(window.GuildBattlePresets.needsPresetReset(o)){
    window.GuildBattlePresets.resetPreset(o);
  }else{
    o.settings.enemies=window.GuildBattlePresets.normalizeList(o.settings.enemies);
  }
  o.settings.currentEnemyIndex=Number.isFinite(+o.settings.currentEnemyIndex)?Math.max(0,Math.min(o.settings.enemies.length-1,+o.settings.currentEnemyIndex)):0;
  o.settings.gasUrl=o.settings.gasUrl||'';
  o.settings.notifyOn=o.settings.notifyOn!==false;
  o.settings.design=o.settings.design||d.settings.design;
  o.currentCustomerId=o.currentCustomerId||'';
  if(!o.currentCustomer&&o.name)o.currentCustomer=o.name;
  return o;
}
function load(){try{let cur=JSON.parse(localStorage.getItem(KEY)); if(cur)return migrate(cur); let old=JSON.parse(localStorage.getItem(OLD)); if(old){old.currentCustomer=old.name||old.currentCustomer||''; return migrate(old)}}catch(e){} return defaults()}
let state=load(); function save(){localStorage.setItem(KEY,JSON.stringify(state)); localStorage.setItem(OLD,JSON.stringify(state))}
function $(id){return document.getElementById(id)} function fileUrl(name){name=String(name||'').trim(); if(!name)return 'background.jpg'; if(/^data:image\//.test(name)||/^https?:\/\//.test(name))return name; return name.replace(/\\/g,'/').replace(/^\/+/, '')} function yen(n){return (Number(n)||0).toLocaleString('ja-JP')+'G'} function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1600)}
function applyStageBg(bg){const fallback=fileUrl((state.settings.design&&state.settings.design.bg)||'background.jpg');const src=fileUrl(bg||fallback);function apply(u){const v='linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.18) 55%,rgba(0,0,0,.72)),url("'+u+'")';$('pageBg').style.backgroundImage=v;$('battleField').style.backgroundImage='linear-gradient(to bottom,rgba(0,0,0,.04),rgba(0,0,0,.32)),url("'+u+'")'}const im=new Image();im.onload=()=>apply(src);im.onerror=()=>apply(fallback);im.src=src} 
function closeAllModals(){document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'))}
function show(id){closeAllModals(); document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active')); const target=$(id); if(target)target.classList.add('active'); if(id==='main')renderMain(); else if(window.GuildAudio && (id==='welcome'||id==='nameScreen')) GuildAudio.playBgm('title')}
function customer(){let n=(state.currentCustomer||'').trim(); if(!n)return null; let c=state.customers.find(x=>x.name===n); if(!c){c={id:uid(),name:n,level:1,title:'新米冒険者',visits:0,total:0,lastVisit:'',memo:''}; state.customers.push(c)} return c}
function enemy(){const list=state.settings.enemies||[]; let i=Math.max(0,Math.min(Math.max(0,list.length-1),Number(state.settings.currentEnemyIndex)||0)); state.settings.currentEnemyIndex=i; return list[i]}
function bgmKeyForEnemy(e){const n=String((e&&e.name)||''); const id=String((e&&e.id)||'').toLowerCase(); if(e&&e.bgm)return e.bgm; if(n.includes('魔王')||id.includes('maou'))return 'maou'; if(n.includes('スライム'))return 'slime'; if(n.includes('ゴブリン'))return 'goblin'; if(n.includes('オーク')||n.includes('ドラゴン'))return 'orc'; if(n.includes('スケルトン')||n.includes('ミミック')||n.includes('ミノタウロス'))return 'cave'; if(n.includes('ガーゴイル')||n.includes('ウィザード'))return 'ruins'; return 'slime'}
function renderMain(){const c=customer(); const e=enemy(); if(!e)return; if(window.GuildAudio)GuildAudio.playBgm(bgmKeyForEnemy(e)); $('advInfo').textContent=c?c.name:'名もなき冒険者'; $('advSub').textContent='Lv.'+(c?c.level:1)+' / '+(c&&c.title?c.title:'二つ名なし'); $('stageInfo').textContent='現在ステージ：'+(e.stage||'---'); $('enemyName').textContent=e.name; $('enemyHpText').textContent='HP '+Math.max(0,Math.ceil(e.hp))+' / '+e.maxHp; $('enemyHpFill').style.width=Math.max(0,Math.min(100,(Number(e.hp)/Number(e.maxHp||1))*100))+'%'; applyStageBg(e.bg||'background.jpg'); $('enemySprite').innerHTML=e.image?'<img src="'+esc(fileUrl(e.image))+'" alt="'+esc(e.name)+'" onerror="this.replaceWith(document.createTextNode(\'👾\'))">':'👾'; renderNotice(); save()}
function renderNotice(){const n=state.settings.notice||{}; const box=$('noticeBox'); if(!n.enabled||!n.body){box.innerHTML='';return} const pos=n.position||'top'; box.style.order=pos==='bottom'?'2':'-1'; box.innerHTML='<div class="panel notice notice-pos-'+esc(pos)+'"><b class="goldtxt">📢 '+esc(n.title||'本日のお知らせ')+'</b><div style="margin-top:6px;line-height:1.5">'+esc(n.body).replace(/\n/g,'<br>')+'</div></div>'}
function openMenu(cat){$('modalTitle').textContent=(CAT_ICONS[cat]||'')+' '+(CATS[cat]||cat); const list=$('productList'); const items=state.products.filter(p=>p.cat===cat && p.hidden!==true); list.innerHTML=items.length?'':'<div class="empty">このカテゴリの商品はありません</div>'; items.forEach(p=>{const el=document.createElement('div'); el.className='panel product'; el.setAttribute('role','button'); el.tabIndex=0; el.innerHTML='<div class="product-info"><div class="product-name">'+(p.image?'<img src="'+esc(fileUrl(p.image))+'" style="width:48px;height:48px;object-fit:cover;border-radius:8px;vertical-align:middle;margin-right:8px" onerror="this.style.display=\'none\'">':esc(p.emoji||'🍽️')+' ')+esc(p.name)+'</div><div class="product-desc">'+esc(p.desc||'')+'</div><div class="product-price">'+yen(p.price)+'</div></div><button type="button" class="btn gold small" data-add-id="'+p.id+'">追加</button>'; const add=()=>addOrder(p.id); el.addEventListener('click',add); el.addEventListener('keydown',ev=>{if(ev.key==='Enter')add()}); el.querySelector('button').addEventListener('click',ev=>{ev.stopPropagation();add()}); list.appendChild(el)}); $('menuModal').classList.add('active')}
function addOrder(id){let p=state.products.find(x=>x.id===id); if(!p)return; if(window.GuildAudio)GuildAudio.playSe('add'); let o=state.orders.find(x=>x.id===id); if(o)o.qty++; else state.orders.push({id,qty:1}); save(); toast('「'+p.name+'」を受注一覧に追加'); renderOrders();}
function orderItems(){return state.orders.map(o=>{const p=state.products.find(x=>x.id===o.id); return p?{id:p.id,name:p.name,cat:p.cat,price:Number(p.price)||0,qty:Number(o.qty)||0,subtotal:(Number(p.price)||0)*(Number(o.qty)||0)}:null}).filter(Boolean)}
function renderOrders(){const list=$('orderList'); const items=orderItems(); const bill=Array.isArray(state.activeBill)?state.activeBill:[]; const billTotal=bill.reduce((s,i)=>s+Number(i.subtotal||0),0); list.innerHTML=items.length?'':'<div class="empty">受注はありません</div>'; items.forEach(i=>{const el=document.createElement('div'); el.className='panel order-item'; el.innerHTML='<div><b class="goldtxt">'+esc(i.name)+'</b><div class="tiny">'+yen(i.price)+' × '+i.qty+' = '+yen(i.subtotal)+'</div></div><div class="qty"><button type="button" class="btn small">−</button><span>'+i.qty+'</span><button type="button" class="btn small">＋</button><button type="button" class="btn red small">取消</button></div>'; const bs=el.querySelectorAll('button'); bs[0].onclick=()=>chg(i.id,-1); bs[1].onclick=()=>chg(i.id,1); bs[2].onclick=()=>del(i.id); list.appendChild(el)}); if(bill.length){const b=document.createElement('div'); b.className='billbox'; b.innerHTML='<b class="goldtxt">未会計の注文</b><div class="tiny">'+bill.map(i=>esc(i.name)+' × '+Number(i.qty||1)).join('<br>')+'</div><div class="greentxt">未会計合計 '+yen(billTotal)+'</div>'; list.appendChild(b)} $('orderTotal').textContent='今回の注文 '+yen(items.reduce((s,i)=>s+i.subtotal,0))+' / 未会計 '+yen(billTotal)}
function chg(id,d){let o=state.orders.find(x=>x.id===id); if(!o)return; o.qty+=d; if(o.qty<=0)state.orders=state.orders.filter(x=>x.id!==id); save(); renderOrders()} function del(id){state.orders=state.orders.filter(x=>x.id!==id); save(); renderOrders()}
function nextEnemy(){let idx=Number(state.settings.currentEnemyIndex)||0; if(idx<14)state.settings.currentEnemyIndex=idx+1; let e=enemy(); if(e.hp<=0)e.hp=e.maxHp; save(); renderMain()}
function recordSale(type,items,total,reason){const c=customer()||{name:'未登録',level:1,title:''}; const rec={id:uid(),type,customer:c.name,items,total,time:new Date().toISOString(),timeText:new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'}),reason:reason||''}; state.sales.push(rec); if(type==='order'||type==='checkout'){c.total=(Number(c.total)||0)+total; c.lastVisit=rec.timeText} save(); return rec}
async function notify(payload){const url=(state.settings.gasUrl||DEFAULT_GAS_URL||'').trim(); if(!url||state.settings.notifyOn===false){toast('通知URL未設定：端末内に保存しました');return false} try{await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(payload)});return true}catch(e){toast('通知送信に失敗：端末内には保存済み');return false}}
function buildPayload(type,sale,items,total,extra){const c=customer(); const e=enemy(); return Object.assign({action:'order',type:type,orderId:sale.id,sale,adventurerId:(c&&c.id)||'',adventurer:(c&&c.name)||sale.customer||'未登録',name:(c&&c.name)||sale.customer||'未登録',title:(c&&c.title)||'',level:(c&&c.level)||1,visits:(c&&c.visits)||0,partyCount:1,items,total,enemy:{name:e.name,hp:e.hp,maxHp:e.maxHp,defeated:false},source:'index',appVersion:APP_VERSION,time:new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})},extra||{})}
function sendKitchenOrder(){if($('main').classList.contains('combat-lock'))return; const items=orderItems(); if(!items.length){toast('受注がありません');return} const total=items.reduce((s,i)=>s+i.subtotal,0); const lines=items.map(i=>'・'+i.name+' ×'+i.qty+' = '+yen(i.subtotal)).join('\n'); if(!confirm('この内容でクエストを受注しますか？\n\n'+lines+'\n\n合計 '+yen(total))){return} $('confirmOrder').disabled=true; const sale=recordSale('order',items,total); state.activeBill=state.activeBill||[]; items.forEach(i=>{const old=state.activeBill.find(x=>x.id===i.id); if(old){old.qty+=i.qty; old.subtotal+=i.subtotal}else state.activeBill.push(Object.assign({},i))}); notify(buildPayload('order',sale,items,total)); state.orders=[]; save(); renderOrders(); renderMain(); $('ordersModal').classList.remove('active'); $('confirmOrder').disabled=false; toast('クエストを受注しました！')}
function applyCheckoutDamage(total,done){
  return window.GuildBattlePresets.applyDamage(total, done, {
    $,
    enemy,
    nextEnemy,
    renderMain,
    save,
    yen,
    isFinalEnemy,
    showMain:()=>show('main'),
    playSe:(k)=>GuildAudio.playSe(k),
    playBgm:(k)=>GuildAudio.playBgm(k),
    stopBgm:()=>GuildAudio.stopBgm()
  });
}
function checkout(){if($('main').classList.contains('combat-lock'))return; const current=orderItems(); const bill=(Array.isArray(state.activeBill)?state.activeBill:[]).slice(); const all=bill.concat(current); const total=all.reduce((s,i)=>s+Number(i.subtotal||0),0); const msg=all.length?'帰還しますか？\n\n会計合計 '+yen(total)+'\n\n会計のみ行います。ダメージは注文確定時に入ります。':'未会計の注文はありません。帰還しますか？'; if(!confirm(msg))return; const sale=recordSale('checkout',all,total); notify(buildPayload('checkout',sale,all,total)); const finish=(defeated)=>{const c=customer(); if(c){c.visits=(Number(c.visits)||0)+1;c.level=Math.max(1,Math.floor((Number(c.total)||0)/3000)+1);c.lastVisit=new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})} state.orders=[]; state.activeBill=[]; save(); renderOrders(); renderMain(); closeAllModals(); $('main').classList.remove('combat-lock'); $('damagePop').classList.remove('on'); toast(defeated?'撃破！ 会計完了':'クエスト達成（会計）を送信しました'); setTimeout(()=>show('welcome'),900)}; finish(false)}

function updateOrderBadge(){const n=state.orders.reduce((s,o)=>s+(Number(o.qty)||0),0); const b=$('openOrders'); if(b)b.textContent='📜 受注一覧'+(n?'（'+n+'）':'')}
function orderConfirmScreen(){const items=orderItems(); if(!items.length){toast('受注がありません');return} const total=items.reduce((s,i)=>s+i.subtotal,0); $('orderConfirmBody').textContent='この内容でクエストを受注しますか？\n\n'+items.map(i=>'・'+i.name+' ×'+i.qty+' = '+yen(i.subtotal)).join('\n')+'\n\n合計 '+yen(total); $('ordersModal').classList.remove('active'); $('orderConfirmModal').classList.add('active')}
function sendKitchenOrderDirect(){
  if($('main').classList.contains('combat-lock'))return;
  const items=orderItems();
  if(!items.length){toast('受注がありません'); if(window.GuildAudio)GuildAudio.playSe('cancel'); return}
  const total=items.reduce((s,i)=>s+i.subtotal,0);
  $('doOrderYes').disabled=true;
  const sale=recordSale('order',items,total);
  state.activeBill=state.activeBill||[];
  items.forEach(i=>{const old=state.activeBill.find(x=>x.id===i.id); if(old){old.qty+=i.qty; old.subtotal+=i.subtotal}else state.activeBill.push(Object.assign({},i))});
  notify(buildPayload('order',sale,items,total,{orderDamage:total}));
  state.orders=[];
  save();
  renderOrders();
  updateOrderBadge();
  $('orderConfirmModal').classList.remove('active');
  show('main');
  const finish=(defeated,finalDefeated)=>{
    save(); renderOrders(); renderMain(); updateOrderBadge(); closeAllModals();
    $('main').classList.remove('combat-lock');
    $('damagePop').classList.remove('on');
    $('doOrderYes').disabled=false;
    toast(finalDefeated?'魔王を討伐した！':(defeated?'撃破！ 注文ダメージが入りました':'注文完了！ ダメージが入りました'));
  };
  if(total>0)applyCheckoutDamage(total,finish); else finish(false,false);
}
function checkoutConfirmScreen(){if($('main').classList.contains('combat-lock'))return; const current=orderItems(); const bill=(Array.isArray(state.activeBill)?state.activeBill:[]).slice(); const all=bill.concat(current); const total=all.reduce((s,i)=>s+Number(i.subtotal||0),0); $('checkoutConfirmBody').textContent=(all.length?'帰還しますか？\n\n'+all.map(i=>'・'+i.name+' ×'+Number(i.qty||1)+' = '+yen(i.subtotal)).join('\n')+'\n\n会計合計 '+yen(total)+'\n\n会計のみ行います。ダメージは注文確定時に入ります。':'未会計の注文はありません。帰還しますか？'); closeAllModals(); $('checkoutConfirmModal').classList.add('active')}
function checkoutDirect(){
  const current=orderItems();
  const bill=(Array.isArray(state.activeBill)?state.activeBill:[]).slice();
  const all=bill.concat(current);
  const total=all.reduce((s,i)=>s+Number(i.subtotal||0),0);
  $('checkoutConfirmModal').classList.remove('active');
  const sale=recordSale('checkout',all,total);
  notify(buildPayload('checkout',sale,all,total,{checkoutOnly:true}));
  const c=customer();
  let oldLv=c?Number(c.level||1):1;
  if(c){
    c.visits=(Number(c.visits)||0)+1;
    c.level=Math.max(1,Math.floor((Number(c.total)||0)/3000)+1);
    c.lastVisit=new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'});
    if(c.level>oldLv && window.GuildAudio)GuildAudio.playSe('levelup');
  }
  state.orders=[];
  state.activeBill=[];
  save();
  renderOrders();
  renderMain();
  updateOrderBadge();
  closeAllModals();
  $('main').classList.remove('combat-lock');
  $('damagePop').classList.remove('on');
  toast('クエスト達成（会計）を送信しました');
  setTimeout(()=>show('welcome'),900);
}
$('startBtn').onclick=()=>{if(window.GuildAudio){GuildAudio.playSe('ok');GuildAudio.playBgm('title')}show('nameScreen')}; $('noBtn').onclick=()=>{if(window.GuildAudio)GuildAudio.playSe('cancel');toast('冷やかしか？さっさとメニューを開け')}; $('welcomeAdminBtn').onclick=()=>location.href='admin.html'; $('backWelcomeBtn').onclick=()=>{if(window.GuildAudio)GuildAudio.playSe('cancel');show('welcome')}; $('saveNameBtn').onclick=()=>{const n=$('advName').value.trim(); if(!n){toast('名前を入力してください'); if(window.GuildAudio)GuildAudio.playSe('cancel'); return} if(window.GuildAudio)GuildAudio.playSe('ok'); state.currentCustomer=n; customer(); save(); show('main')}; document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>openMenu(b.dataset.cat)); document.addEventListener('click',ev=>{const cat=ev.target.closest('[data-cat]'); if(cat){openMenu(cat.dataset.cat);return} const add=ev.target.closest('[data-add-id]'); if(add){ev.preventDefault();ev.stopPropagation();addOrder(add.dataset.addId);return}}); $('closeMenu').onclick=()=>$('menuModal').classList.remove('active'); $('openOrders').onclick=()=>{renderOrders();$('ordersModal').classList.add('active')}; $('closeOrders').onclick=()=>$('ordersModal').classList.remove('active'); $('confirmOrder').onclick=orderConfirmScreen; const chk=$('checkoutFromOrders'); if(chk)chk.onclick=checkoutConfirmScreen; $('clearOrder').onclick=()=>{state.orders=[];save();renderOrders();updateOrderBadge()}; $('questClear').onclick=checkoutConfirmScreen; $('cancelOrderConfirm').onclick=()=>$('orderConfirmModal').classList.remove('active'); $('doOrderNo').onclick=()=>$('orderConfirmModal').classList.remove('active'); $('doOrderYes').onclick=sendKitchenOrderDirect; $('cancelCheckoutConfirm').onclick=()=>$('checkoutConfirmModal').classList.remove('active'); $('doCheckoutNo').onclick=()=>$('checkoutConfirmModal').classList.remove('active'); $('doCheckoutYes').onclick=checkoutDirect; if($('appVersion'))$('appVersion').textContent=APP_VERSION; if(state.currentCustomer)$('advName').value=state.currentCustomer; renderMain(); updateOrderBadge();
})();
