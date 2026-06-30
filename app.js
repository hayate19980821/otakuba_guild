window.GuildApp = {VERSION:'3.0-charge-party'};
(async function(){
  const {$}=GuildUtils;
  const data = await GuildStorage.init();

  GuildAudio.init(data.settings);
  GuildBattle.init(data);
  GuildMenu.init(data);

  if($('appVersion')) $('appVersion').textContent = GuildApp.VERSION;
  if(data.currentCustomer) $('nameInput').value=data.currentCustomer;

  function ensureHomeButton(){
    if($('btnBackTitle')) return;
    const checkoutBtn = $('btnCheckout');
    if(!checkoutBtn || !checkoutBtn.parentNode) return;

    const btn = document.createElement('button');
    btn.id = 'btnBackTitle';
    btn.className = 'btn checkout-main';
    btn.textContent = '🏠 最初の画面へ';
    btn.style.marginTop = '8px';
    btn.onclick = () => {
      GuildAudio.playSe('cancel');
      GuildUI.closeModals();
      GuildUI.show('screenWelcome');
      GuildAudio.playBgm('title');
    };
    checkoutBtn.insertAdjacentElement('afterend', btn);
  }

  function ensurePartyScreen(){
    if($('screenParty')) return;

    const app = document.querySelector('.app');
    const section = document.createElement('section');
    section.className = 'screen center';
    section.id = 'screenParty';
    section.innerHTML = `
      <div class="panel window">
        <div class="title-logo small">パーティ人数</div>
        <p>ご来店人数を選択してください</p>
        <div style="display:flex;align-items:center;gap:10px;justify-content:center;margin:14px 0;">
          <button class="btn" id="btnPartyMinus" type="button">−</button>
          <div class="panel" style="min-width:110px;padding:10px;">
            <div id="partyCountView" style="font-size:26px;font-weight:900;color:var(--gold);">1名</div>
          </div>
          <button class="btn" id="btnPartyPlus" type="button">＋</button>
        </div>
        <div class="tiny" id="chargePreview"></div>
        <div class="row mt">
          <button class="btn gold" id="btnPartyOk">次へ</button>
          <button class="btn" id="btnPartyBack">戻る</button>
        </div>
      </div>
    `;
    app.appendChild(section);

    $('btnPartyMinus').onclick=()=>{
      data.partyCount = Math.max(1, Number(data.partyCount || 1) - 1);
      GuildStorage.save();
      renderParty();
    };
    $('btnPartyPlus').onclick=()=>{
      data.partyCount = Math.min(20, Number(data.partyCount || 1) + 1);
      GuildStorage.save();
      renderParty();
    };
    $('btnPartyBack').onclick=()=>{
      GuildAudio.playSe('cancel');
      GuildUI.show('screenName');
    };
    $('btnPartyOk').onclick=()=>{
      GuildAudio.playSe('ok');
      showChargeConfirm();
    };
  }

  function renderParty(){
    const count = Math.max(1, Math.min(20, Number(data.partyCount || 1) || 1));
    data.partyCount = count;
    const charge = Number(data.settings.coverCharge ?? 500) || 0;
    if($('partyCountView')) $('partyCountView').textContent = `${count}名`;
    if($('chargePreview')) $('chargePreview').textContent = `ギルド登録料（チャージ）：${GuildUtils.yen(charge, data.settings.currency)} × ${count}名 = ${GuildUtils.yen(charge*count, data.settings.currency)}`;
  }

  function ensureChargeModal(){
    if($('modalChargeConfirm')) return;

    const app = document.querySelector('.app');
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modalChargeConfirm';
    modal.innerHTML = `
      <div class="modal-head">
        <h2>ギルド登録料</h2>
        <button class="btn small" id="btnCancelCharge">戻る</button>
      </div>
      <div class="scroll">
        <div class="panel">
          <div id="chargeConfirmBody" class="confirm-text"></div>
          <div class="row mt">
            <button class="btn gold" id="btnDoCharge">登録する</button>
            <button class="btn" id="btnNoCharge">いいえ</button>
          </div>
        </div>
      </div>
    `;
    app.appendChild(modal);

    $('btnCancelCharge').onclick=()=>GuildUI.closeModals();
    $('btnNoCharge').onclick=()=>{
      GuildAudio.playSe('cancel');
      GuildUI.closeModals();
      GuildUI.show('screenWelcome');
    };
    $('btnDoCharge').onclick=()=>{
      GuildAudio.playSe('ok');
      applyCoverCharge();
      GuildUI.closeModals();
      GuildUI.show('screenMain');
      GuildBattle.render();
      ensureHomeButton();
    };
  }

  function showChargeConfirm(){
    ensureChargeModal();
    const count = Math.max(1, Math.min(20, Number(data.partyCount || 1) || 1));
    const charge = Number(data.settings.coverCharge ?? 500) || 0;
    const total = charge * count;

    $('chargeConfirmBody').textContent =
      `ギルドへの登録には登録料（チャージ）が必要です。\n\n`+
      `冒険者名：${data.currentCustomer || '未登録'}\n`+
      `パーティ人数：${count}名\n`+
      `登録料：${GuildUtils.yen(charge, data.settings.currency)} × ${count}名\n\n`+
      `合計：${GuildUtils.yen(total, data.settings.currency)}\n\n`+
      `登録しますか？`;

    GuildUI.openModal('modalChargeConfirm');
  }

  function applyCoverCharge(){
    const count = Math.max(1, Math.min(20, Number(data.partyCount || 1) || 1));
    const charge = Number(data.settings.coverCharge ?? 500) || 0;
    const total = charge * count;

    data.activeBill = Array.isArray(data.activeBill) ? data.activeBill : [];
    data.activeBill = data.activeBill.filter(item => item.id !== 'cover_charge');

    if(charge > 0 && count > 0){
      data.activeBill.unshift({
        id:'cover_charge',
        name:'ギルド登録料（チャージ）',
        cat:'charge',
        price:charge,
        qty:count,
        subtotal:total,
        partyCount:count,
        isCharge:true
      });
    }

    GuildStorage.save();
  }

  $('btnStartYes').onclick=()=>{
    GuildAudio.playSe('ok');
    GuildAudio.playBgm('title');
    GuildUI.show('screenName');
  };

  $('btnStartNo').onclick=()=>{
    GuildAudio.playSe('cancel');
    GuildUI.toast('冷やかしか？さっさとメニューを開け');
  };

  $('btnAdmin').onclick=()=>location.href='admin.html';

  $('btnBackWelcome').onclick=()=>{
    GuildAudio.playSe('cancel');
    GuildUI.show('screenWelcome');
  };

  $('btnNameOk').onclick=()=>{
    const n=$('nameInput').value.trim();
    if(!n){
      GuildAudio.playSe('cancel');
      GuildUI.toast('名前を入力してください');
      return;
    }
    GuildAudio.playSe('ok');
    GuildCustomer.setName(n);
    ensurePartyScreen();
    renderParty();
    GuildUI.show('screenParty');
  };

  $('btnCloseMenu').onclick=()=>GuildUI.closeModals();
  $('btnCancelOrder').onclick=GuildOrder.cancelPending;
  $('btnNoOrder').onclick=GuildOrder.cancelPending;
  $('btnDoOrder').onclick=GuildOrder.confirmOrder;
  $('btnCheckout').onclick=GuildOrder.checkoutAsk;
  $('btnCancelCheckout').onclick=()=>GuildUI.closeModals();
  $('btnNoCheckout').onclick=()=>GuildUI.closeModals();
  $('btnDoCheckout').onclick=GuildOrder.checkoutDo;

  GuildUI.show('screenWelcome');
  GuildAudio.playBgm('title');
})();
