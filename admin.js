(async function(){
  const {$, esc, yen} = GuildUtils;
  const data = await GuildStorage.init();
  const SESSION='otakuba.v3.full.admin.session';
  const tabs=[['dash','📊 概要'],['menu','🍴 メニュー'],['monsters','⚔️ 討伐'],['settings','⚙️ 設定'],['customers','👤 顧客'],['sales','💰 売上'],['export','💾 出力'],['reset','🧹 初期化']];
  let current='dash';
  function loginOk(){ return sessionStorage.getItem(SESSION)==='ok'; }
  function showLogin(){ $('adminLogin').classList.remove('hidden'); $('adminApp').classList.add('hidden'); }
  function showApp(){ $('adminLogin').classList.add('hidden'); $('adminApp').classList.remove('hidden'); renderTabs(); render(); }
  function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),1500); }
  function save(){ GuildStorage.save(); toast('保存しました'); render(); }
  function num(v){ return Number(v)||0; }
  function uid(prefix){ return GuildUtils.uid(prefix); }
  function opt(value, label, selected){ return `<option value="${esc(value)}" ${String(value)===String(selected)?'selected':''}>${esc(label)}</option>`; }
  const cats=()=>data.settings.categories||[];
  const bgOptions=['grass.png','forest.png','cave.png','ruins.png','mountain.png','volcano.png','castle.png','background.jpg'];
  const monsterOptions=['slime.png','goblin.png','orc.png','skeleton.png','mimic.png','minotaur.png','gargoyle.png','dragon.png','dark_wizard.png','maou.png'];
  const bgmOptions=['title','slime','goblin','orc','cave','ruins','maou','ending'];

  $('adminLoginBtn').onclick=()=>{ if($('adminPass').value === (data.settings.adminPassword || 'OTAKU')){ sessionStorage.setItem(SESSION,'ok'); showApp(); } else $('loginError').textContent='パスワードが違います'; };
  $('adminBackToIndex').onclick=()=>{ location.href='index.html'; };
  $('adminHeaderToIndex').onclick=()=>{ location.href='index.html'; };
  $('logoutBtn').onclick=()=>{ sessionStorage.removeItem(SESSION); showLogin(); };
  function renderTabs(){ $('adminTabs').innerHTML=tabs.map(t=>`<button class="tab ${current===t[0]?'active':''}" data-tab="${t[0]}">${t[1]}</button>`).join(''); document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{current=b.dataset.tab;renderTabs();render();}); }

  function renderDash(){
    const c=data.customers.length;
    const salesTotal=data.sales.filter(x=>x.type==='checkout').reduce((a,x)=>a+num(x.total),0);
    const e=data.monsters[data.currentEnemyIndex]||{};
    const bill=(data.activeBill||[]).reduce((a,x)=>a+num(x.subtotal),0);
    $('adminContent').innerHTML=`<h2>概要</h2><div class="grid">
      <div class="admin-card"><div class="admin-card-title">現在の敵</div><b>${esc(e.name||'-')}</b><br>HP ${num(e.hp)}/${num(e.maxHp)}</div>
      <div class="admin-card"><div class="admin-card-title">顧客数</div>${c}</div>
      <div class="admin-card"><div class="admin-card-title">会計売上累計</div>${yen(salesTotal,data.settings.currency)}</div>
      <div class="admin-card"><div class="admin-card-title">未会計合計</div>${yen(bill,data.settings.currency)}</div>
    </div><p class="tiny mt">ここからメニュー・討伐・顧客をカード形式で編集できます。JSON直接編集は「出力」から確認できます。</p>`;
  }

  function renderMenu(){
    $('adminContent').innerHTML=`<h2>メニュー管理</h2><div class="toolbar"><button class="btn gold" id="addProduct">商品追加</button><button class="btn" id="saveAll">保存</button></div><div class="admin-list" id="menuCards"></div>`;
    $('addProduct').onclick=()=>{ data.menu.push({id:uid('menu'),cat:(cats()[0]&&cats()[0].id)||'food',name:'新商品',price:500,emoji:'🍽️',desc:'',image:'',hidden:false}); save(); };
    $('saveAll').onclick=save;
    const box=$('menuCards');
    box.innerHTML=(data.menu||[]).map((p,i)=>`<div class="admin-edit-card">
      <div class="admin-card-title">${esc(p.name||'商品')} <span class="tiny">${esc(p.cat||p.category||'')}</span></div>
      <label>商品名<input data-menu="name" data-i="${i}" value="${esc(p.name||'')}"></label>
      <div class="admin-two"><label>価格<input type="number" data-menu="price" data-i="${i}" value="${num(p.price)}"></label><label>カテゴリ<select data-menu="cat" data-i="${i}">${cats().map(c=>opt(c.id,`${c.icon||''} ${c.name}`,p.cat||p.category)).join('')}</select></label></div>
      <label>絵文字<input data-menu="emoji" data-i="${i}" value="${esc(p.emoji||p.icon||'')}"></label>
      <label>説明<textarea rows="2" data-menu="desc" data-i="${i}">${esc(p.desc||'')}</textarea></label>
      <label>画像ファイル<input data-menu="image" data-i="${i}" value="${esc(p.image||'')}"></label>
      <label class="checkline"><input type="checkbox" data-menu="hidden" data-i="${i}" ${p.hidden?'checked':''}> 非表示</label>
      <div class="toolbar"><button class="btn gold small" data-menu-save="${i}">保存</button><button class="btn red small" data-menu-del="${i}">削除</button></div>
    </div>`).join('') || '<div class="empty">商品がありません</div>';
    box.querySelectorAll('[data-menu]').forEach(el=>el.oninput=el.onchange=()=>{ const p=data.menu[+el.dataset.i]; const k=el.dataset.menu; p[k]= k==='price'?num(el.value):(k==='hidden'?el.checked:el.value); });
    box.querySelectorAll('[data-menu-save]').forEach(b=>b.onclick=save);
    box.querySelectorAll('[data-menu-del]').forEach(b=>b.onclick=()=>{ if(confirm('この商品を削除しますか？')){ data.menu.splice(+b.dataset.menuDel,1); save(); }});
  }

  function renderMonsters(){
    $('adminContent').innerHTML=`<h2>討伐管理</h2><div class="toolbar"><button class="btn gold" id="addEnemy">敵追加</button><button class="btn" id="saveAll">保存</button><button class="btn red" id="resetHp">全HP回復</button></div><div class="admin-list" id="monsterCards"></div>`;
    $('addEnemy').onclick=()=>{ data.monsters.push({id:uid('enemy'),name:'新しい敵',stage:'草原',hp:500,maxHp:500,bg:'grass.png',image:'slime.png',bgm:'slime'}); save(); };
    $('saveAll').onclick=save;
    $('resetHp').onclick=()=>{ if(confirm('全モンスターのHPを最大値に戻しますか？')){ data.monsters.forEach(m=>m.hp=num(m.maxHp)); save(); }};
    const box=$('monsterCards');
    box.innerHTML=(data.monsters||[]).map((m,i)=>`<div class="admin-edit-card ${i===data.currentEnemyIndex?'current-enemy':''}">
      <div class="monster-row"><img src="${esc(m.image||'slime.png')}" onerror="this.style.display='none'"><div><div class="admin-card-title">${i+1}. ${esc(m.name||'敵')}</div><div class="tiny">${esc(m.stage||'')} / HP ${num(m.hp)}/${num(m.maxHp)}</div></div></div>
      <label>敵名<input data-mon="name" data-i="${i}" value="${esc(m.name||'')}"></label>
      <div class="admin-two"><label>ステージ<input data-mon="stage" data-i="${i}" value="${esc(m.stage||'')}"></label><label>BGM<select data-mon="bgm" data-i="${i}">${bgmOptions.map(x=>opt(x,x,m.bgm)).join('')}</select></label></div>
      <div class="admin-two"><label>現在HP<input type="number" data-mon="hp" data-i="${i}" value="${num(m.hp)}"></label><label>最大HP<input type="number" data-mon="maxHp" data-i="${i}" value="${num(m.maxHp)}"></label></div>
      <div class="admin-two"><label>背景<select data-mon="bg" data-i="${i}">${bgOptions.map(x=>opt(x,x,m.bg)).join('')}</select></label><label>敵画像<select data-mon="image" data-i="${i}">${monsterOptions.map(x=>opt(x,x,m.image)).join('')}</select></label></div>
      <div class="toolbar"><button class="btn gold small" data-mon-save="${i}">この敵を保存</button><button class="btn small" data-set-current="${i}">現在の敵にする</button><button class="btn small" data-dup="${i}">複製</button><button class="btn red small" data-mon-del="${i}">削除</button></div>
    </div>`).join('') || '<div class="empty">敵がありません</div>';
    box.querySelectorAll('[data-mon]').forEach(el=>el.oninput=el.onchange=()=>{ const m=data.monsters[+el.dataset.i]; const k=el.dataset.mon; m[k]=(k==='hp'||k==='maxHp')?num(el.value):el.value; if(k==='bg')m.background=el.value; });
    box.querySelectorAll('[data-mon-save]').forEach(b=>b.onclick=save);
    box.querySelectorAll('[data-set-current]').forEach(b=>b.onclick=()=>{ data.currentEnemyIndex=+b.dataset.setCurrent; save(); });
    box.querySelectorAll('[data-dup]').forEach(b=>b.onclick=()=>{ const copy=JSON.parse(JSON.stringify(data.monsters[+b.dataset.dup])); copy.id=uid('enemy'); data.monsters.splice(+b.dataset.dup+1,0,copy); save(); });
    box.querySelectorAll('[data-mon-del]').forEach(b=>b.onclick=()=>{ if(confirm('この敵を削除しますか？')){ data.monsters.splice(+b.dataset.monDel,1); data.currentEnemyIndex=Math.min(data.currentEnemyIndex,Math.max(0,data.monsters.length-1)); save(); }});
  }

  function renderSettings(){
    const s=data.settings;
    $('adminContent').innerHTML=`<h2>設定</h2><div class="admin-list"><div class="admin-edit-card">
      <label>ギルド名<input id="guildName" value="${esc(s.guildName||'')}"></label>
      <div class="admin-two"><label>通貨<input id="currency" value="${esc(s.currency||'G')}"></label><label>管理パスワード<input id="adminPassword" value="${esc(s.adminPassword||'OTAKU')}"></label></div>
      <label>GAS / Discord URL<input id="gasUrl" value="${esc(s.gasUrl||s.discordWebhookUrl||'')}"></label>
      <div class="admin-two"><label>BGM音量<input type="number" step="0.05" min="0" max="1" id="bgmVolume" value="${Number(s.bgmVolume??0.45)}"></label><label>SE音量<input type="number" step="0.05" min="0" max="1" id="seVolume" value="${Number(s.seVolume??0.9)}"></label></div>
      <label class="checkline"><input type="checkbox" id="notifyOn" ${s.notifyOn!==false?'checked':''}> 通知ON</label>
      <div class="toolbar"><button class="btn gold" id="saveSettings">保存</button></div>
    </div></div>`;
    $('saveSettings').onclick=()=>{ Object.assign(s,{guildName:$('guildName').value,currency:$('currency').value||'G',adminPassword:$('adminPassword').value||'OTAKU',gasUrl:$('gasUrl').value,discordWebhookUrl:$('gasUrl').value,bgmVolume:Number($('bgmVolume').value),seVolume:Number($('seVolume').value),notifyOn:$('notifyOn').checked}); save(); };
  }

  function renderCustomers(){
    $('adminContent').innerHTML=`<h2>顧客管理</h2><div class="admin-list" id="customerCards"></div>`;
    const box=$('customerCards');
    box.innerHTML=(data.customers||[]).map((c,i)=>`<div class="admin-edit-card"><div class="admin-card-title">${esc(c.name||'冒険者')}</div>
      <div class="admin-two"><label>名前<input data-cust="name" data-i="${i}" value="${esc(c.name||'')}"></label><label>Lv<input type="number" data-cust="level" data-i="${i}" value="${num(c.level||1)}"></label></div>
      <div class="admin-two"><label>二つ名<input data-cust="title" data-i="${i}" value="${esc(c.title||'')}"></label><label>来店回数<input type="number" data-cust="visits" data-i="${i}" value="${num(c.visits)}"></label></div>
      <label>累計注文<input type="number" data-cust="total" data-i="${i}" value="${num(c.total)}"></label>
      <label>メモ<textarea rows="2" data-cust="memo" data-i="${i}">${esc(c.memo||'')}</textarea></label>
      <div class="tiny">最終来店：${esc(c.lastVisit||'-')}</div><div class="toolbar"><button class="btn gold small" data-cust-save="${i}">保存</button><button class="btn red small" data-cust-del="${i}">削除</button></div></div>`).join('') || '<div class="empty">顧客データはまだありません</div>';
    box.querySelectorAll('[data-cust]').forEach(el=>el.oninput=el.onchange=()=>{ const c=data.customers[+el.dataset.i]; const k=el.dataset.cust; c[k]=['level','visits','total'].includes(k)?num(el.value):el.value; });
    box.querySelectorAll('[data-cust-save]').forEach(b=>b.onclick=save);
    box.querySelectorAll('[data-cust-del]').forEach(b=>b.onclick=()=>{ if(confirm('この顧客を削除しますか？')){ data.customers.splice(+b.dataset.custDel,1); save(); }});
  }

  function renderSales(){
    const total=(data.sales||[]).filter(x=>x.type==='checkout').reduce((a,x)=>a+num(x.total),0);
    $('adminContent').innerHTML=`<h2>売上</h2><div class="toolbar"><button class="btn red" id="clearSales">売上一覧を削除</button></div><div class="admin-card"><div class="admin-card-title">会計売上累計</div>${yen(total,data.settings.currency)}</div><div class="admin-list">${(data.sales||[]).slice().reverse().map(s=>`<div class="admin-edit-card"><div class="admin-card-title">${esc(s.customer||'-')} / ${yen(s.total,data.settings.currency)}</div><div class="tiny">${esc(s.timeText||s.time||'')}</div><div>${(s.items||[]).map(i=>`・${esc(i.name)} ×${num(i.qty)} = ${yen(i.subtotal,data.settings.currency)}`).join('<br>')}</div></div>`).join('')||'<div class="empty">売上はまだありません</div>'}</div>`;
    $('clearSales').onclick=()=>{ if(confirm('売上一覧を削除しますか？')){ data.sales=[]; save(); }};
  }

  function renderRaw(key,label){ $('adminContent').innerHTML=`<h2>${label}</h2><textarea class="json-box" id="jsonEdit">${esc(JSON.stringify(data[key],null,2))}</textarea><div class="toolbar"><button class="btn gold" id="saveJson">保存</button><button class="btn" id="formatJson">整形</button></div>`; $('saveJson').onclick=()=>{ try{ data[key]=JSON.parse($('jsonEdit').value); save(); }catch(e){ toast('JSONエラー: '+e.message); } }; $('formatJson').onclick=()=>{ try{$('jsonEdit').value=JSON.stringify(JSON.parse($('jsonEdit').value),null,2);}catch(e){toast('JSONエラー');} }; }
  function render(){ if(current==='dash')renderDash(); if(current==='menu')renderMenu(); if(current==='monsters')renderMonsters(); if(current==='settings')renderSettings(); if(current==='customers')renderCustomers(); if(current==='sales')renderSales(); if(current==='export')renderRaw('','全データExport'),$('jsonEdit').value=JSON.stringify(data,null,2); if(current==='reset'){ $('adminContent').innerHTML=`<h2>初期化</h2><p>討伐進行と未会計注文だけをリセットします。</p><button class="btn red" id="resetProgress">討伐進行を初期化</button>`; $('resetProgress').onclick=()=>{ if(confirm('討伐進行を初期化しますか？')){ GuildStorage.resetProgress(); toast('リセットしました'); render(); } }; } }
  loginOk()?showApp():showLogin();
})();
