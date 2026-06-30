window.GuildApp = {VERSION:'3.0-return-home'};
(async function(){
  const {$}=GuildUtils;
  const data = await GuildStorage.init();
  GuildAudio.init(data.settings);
  GuildBattle.init(data);
  GuildMenu.init(data);
  if($('appVersion')) $('appVersion').textContent = GuildApp.VERSION;
  if(data.currentCustomer) $('nameInput').value=data.currentCustomer;
  $('btnStartYes').onclick=()=>{ GuildAudio.playSe('ok'); GuildAudio.playBgm('title'); data.currentCustomer ? (GuildUI.show('screenMain'), GuildBattle.render()) : GuildUI.show('screenName'); };
  $('btnStartNo').onclick=()=>{ GuildAudio.playSe('cancel'); GuildUI.toast('冷やかしか？さっさとメニューを開け'); };
  $('btnAdmin').onclick=()=>location.href='admin.html';
  $('btnBackWelcome').onclick=()=>{ GuildAudio.playSe('cancel'); GuildUI.show('screenWelcome'); };
  $('btnNameOk').onclick=()=>{ const n=$('nameInput').value.trim(); if(!n){ GuildAudio.playSe('cancel'); GuildUI.toast('名前を入力してください'); return; } GuildAudio.playSe('ok'); GuildCustomer.setName(n); GuildUI.show('screenMain'); GuildBattle.render(); };
  $('btnCloseMenu').onclick=()=>GuildUI.closeModals();
  $('btnCancelOrder').onclick=GuildOrder.cancelPending;
  $('btnNoOrder').onclick=GuildOrder.cancelPending;
  $('btnDoOrder').onclick=GuildOrder.confirmOrder;
  $('btnCheckout').onclick=GuildOrder.checkoutAsk;
  $('btnCancelCheckout').onclick=()=>GuildUI.closeModals();
  $('btnNoCheckout').onclick=()=>GuildUI.closeModals();
  $('btnDoCheckout').onclick=GuildOrder.checkoutDo;

  // 一般画面から最初の選択画面へ戻るボタン。
  // 管理者画面への入口は最初の画面だけに残す。
  const checkoutBtn = $('btnCheckout');
  if(checkoutBtn && !$('btnReturnWelcome')){
    const backBtn = document.createElement('button');
    backBtn.id = 'btnReturnWelcome';
    backBtn.className = 'btn checkout-main';
    backBtn.textContent = '🏠 最初の画面へ';
    backBtn.onclick = () => {
      GuildAudio.playSe('cancel');
      GuildAudio.playBgm('title');
      GuildUI.show('screenWelcome');
    };
    checkoutBtn.insertAdjacentElement('afterend', backBtn);
  }
  GuildUI.show('screenWelcome');
  GuildAudio.playBgm('title');
})();
