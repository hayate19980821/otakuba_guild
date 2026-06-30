window.GuildMenu = (() => {
  const {$, esc, yen} = GuildUtils;
  let data;
  function init(d){ data=d; renderCategoryButtons(); }
  function categoryInfo(cat){ return (data.settings.categories||[]).find(c=>c.id===cat) || {id:cat,name:cat,icon:'🍽️'}; }
  function renderCategoryButtons(){
    const box=$('categoryButtons');
    box.innerHTML='';
    (data.settings.categories||[]).forEach(c=>{
      const b=document.createElement('button');
      b.className='btn';
      b.textContent=`${c.icon||''} ${c.name}`;
      b.onclick=()=>openCategory(c.id);
      box.appendChild(b);
    });
  }
  function openCategory(cat){
    const info=categoryInfo(cat);
    $('menuTitle').textContent=`${info.icon||''} ${info.name}`;
    const list=$('productList');
    const items=(data.menu||[]).filter(p=> cat==='all' ? p.hidden!==true : ((p.cat||p.category)===cat && p.hidden!==true));
    list.innerHTML=items.length?'':'<div class="empty">このカテゴリの商品はありません</div>';
    items.forEach(p=>{
      let qty = 1;
      const el=document.createElement('div');
      el.className='panel product product-qty-card';
      const price = Number(p.price)||0;
      function totalText(){ return yen(price * qty, data.settings.currency); }
      el.innerHTML=`
        <div class="product-info">
          <div class="product-name">${p.image?`<img src="${esc(p.image)}" alt="" class="menu-thumb">`:esc(p.emoji||p.icon||'🍽️')} ${esc(p.name)}</div>
          <div class="product-desc">${esc(p.desc||'')}</div>
          <div class="product-price"><span class="unit-price">${yen(price,data.settings.currency)}</span> / 合計 <span class="line-total">${totalText()}</span></div>
        </div>
        <div class="product-actions">
          <div class="qty-control">
            <button type="button" class="btn small qty-minus">−</button>
            <span class="qty-num">1</span>
            <button type="button" class="btn small qty-plus">＋</button>
          </div>
          <button type="button" class="btn gold small order-btn">注文</button>
        </div>
      `;
      const qtyNum = el.querySelector('.qty-num');
      const lineTotal = el.querySelector('.line-total');
      function renderQty(){ qtyNum.textContent = qty; lineTotal.textContent = totalText(); }
      el.querySelector('.qty-minus').onclick=()=>{ if(qty>1){ qty--; GuildAudio.playSe('cancel'); renderQty(); } };
      el.querySelector('.qty-plus').onclick=()=>{ if(qty<99){ qty++; GuildAudio.playSe('ok'); renderQty(); } };
      el.querySelector('.order-btn').onclick=()=>GuildOrder.askOrder(p, qty);
      list.appendChild(el);
    });
    GuildUI.openModal('modalMenu');
  }
  return {init, openCategory, renderCategoryButtons};
})();
