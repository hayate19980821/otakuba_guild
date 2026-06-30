window.GuildApp = {VERSION:'3.0-stable-direct-home'};
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

  $('btnStartYes').onclick=()=>{
    GuildAudio.playSe('ok');
    GuildAudio.playBgm('title');
    if(data.currentCustomer){
      GuildUI.show('screenMain');
      GuildBattle.render();
      ensureHomeButton();
    }else{
      GuildUI.show('screenName');
    }
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
    GuildUI.show('screenMain');
    GuildBattle.render();
    ensureHomeButton();
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
