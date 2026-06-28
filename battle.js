/* おたく場ギルド 討伐システムβ v6 */
(function(){
  "use strict";

  const STORAGE_KEY = "otakubaBattle.v1";

  const ENEMIES = [
    { id:"slime", name:"スライム", hp:500, stage:"草原", bg:"grass.png", image:"slime.png", icon:"🟢" },
    { id:"goblin_1", name:"ゴブリン 1/3", hp:500, stage:"森", bg:"forest.png", image:"goblin.png", icon:"👺" },
    { id:"goblin_2", name:"ゴブリン 2/3", hp:500, stage:"森", bg:"forest.png", image:"goblin.png", icon:"👺" },
    { id:"goblin_3", name:"ゴブリン 3/3", hp:500, stage:"森", bg:"forest.png", image:"goblin.png", icon:"👺" },
    { id:"orc_1", name:"オーク 1/2", hp:2500, stage:"山", bg:"mountain.png", image:"orc.png", icon:"🪓" },
    { id:"orc_2", name:"オーク 2/2", hp:2500, stage:"山", bg:"mountain.png", image:"orc.png", icon:"🪓" },
    { id:"skeleton_1", name:"スケルトン 1/2", hp:1000, stage:"洞窟", bg:"cave.png", image:"skeleton.png", icon:"💀" },
    { id:"skeleton_2", name:"スケルトン 2/2", hp:1000, stage:"洞窟", bg:"cave.png", image:"skeleton.png", icon:"💀" },
    { id:"mimic_1", name:"ミミック 1/2", hp:2500, stage:"洞窟", bg:"cave.png", image:"mimic.png", icon:"📦" },
    { id:"mimic_2", name:"ミミック 2/2", hp:2500, stage:"洞窟", bg:"cave.png", image:"mimic.png", icon:"📦" },
    { id:"gargoyle", name:"ガーゴイル", hp:5000, stage:"遺跡", bg:"ruins.png", image:"gargoyle.png", icon:"🗿" },
    { id:"dark_wizard", name:"ダークウィザード", hp:10000, stage:"遺跡", bg:"ruins.png", image:"dark_wizard.png", icon:"🧙" },
    { id:"minotaur", name:"ミノタウロス", hp:10000, stage:"火山", bg:"volcano.png", image:"minotaur.png", icon:"🐂" },
    { id:"dragon", name:"ドラゴン", hp:15000, stage:"王城前", bg:"castle.png", image:"dragon.png", icon:"🐉" },
    { id:"maou", name:"魔王", hp:20000, stage:"魔王城 玉座", bg:"castle.png", image:"maou.png", icon:"👑" }
  ];

  const $ = id => document.getElementById(id);

  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const s = JSON.parse(raw);
        if(Number.isFinite(s.index) && Number.isFinite(s.hp)) return s;
      }
    }catch(e){}
    return { index:0, hp:ENEMIES[0].hp, defeated:[], totalDamage:0, lastLog:"討伐開始！" };
  }
  function save(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function current(state){ return state.index >= ENEMIES.length ? ENEMIES[ENEMIES.length - 1] : (ENEMIES[state.index] || ENEMIES[0]); }

  function ensurePanel(){
    let panel = $("battlePanel");
    if(panel) return panel;

    const menu = $("screenMenu");
    const tabs = $("tabs") || document.querySelector("#screenMenu .tabs");
    if(!menu || !tabs) return null;

    panel = document.createElement("div");
    panel.id = "battlePanel";
    panel.className = "battle-panel";
    panel.innerHTML = `
      <div class="battle-title">
        <span class="battle-stage-name" id="battleStageName">討伐</span>
        <span class="battle-enemy-name" id="battleEnemyName">敵</span>
      </div>
      <div class="battle-field" id="battleField">
        <img class="battle-enemy" id="battleEnemyImg" alt="">
        <div class="battle-fallback hidden" id="battleFallback">⚔️</div>
      </div>
      <div class="battle-hp-wrap">
        <div class="battle-hp-row">
          <span>HP</span>
          <span class="battle-hp-text" id="battleHpText">0 / 0</span>
        </div>
        <div class="battle-hp-bar"><div class="battle-hp-fill" id="battleHpFill"></div></div>
      </div>
      <div class="battle-log" id="battleLog">討伐開始！</div>
    `;
    menu.insertBefore(panel, tabs);
    return panel;
  }

  function setAppBackground(enemy){
    const bg = document.querySelector(".bg");
    if(!bg || !enemy) return;
    bg.style.backgroundImage = `linear-gradient(to bottom,rgba(0,0,0,.02) 0%,rgba(0,0,0,.08) 45%,rgba(0,0,0,.72) 82%,rgba(0,0,0,.92)),url("${enemy.bg}")`;
    bg.style.backgroundPosition = "center top";
    bg.style.backgroundSize = "cover";
  }

  function render(){
    const panel = ensurePanel();
    if(!panel) return;

    const s = load();
    const e = current(s);
    const cleared = s.index >= ENEMIES.length;

    setAppBackground(cleared ? {bg:"castle.png"} : e);

    const img = $("battleEnemyImg");
    const fallback = $("battleFallback");
    const hpText = $("battleHpText");
    const hpFill = $("battleHpFill");
    const log = $("battleLog");

    if(cleared){
      if(img) img.classList.add("hidden");
      if(fallback){ fallback.classList.remove("hidden"); fallback.textContent = "🏆"; }
      if(hpText) hpText.textContent = "CLEAR";
      if(hpFill) hpFill.style.width = "0%";
      if(log) log.textContent = "全ての敵を討伐した！";
      return;
    }

    if(img){
      img.src = e.image;
      img.alt = e.name;
      img.classList.remove("hidden");
      img.onerror = function(){
        img.classList.add("hidden");
        if(fallback){
          fallback.classList.remove("hidden");
          fallback.textContent = e.icon || "⚔️";
        }
      };
      img.onload = function(){
        if(fallback) fallback.classList.add("hidden");
      };
    }

    const hp = Math.max(0, Number(s.hp || e.hp));
    const max = Number(e.hp || 1);
    if(hpText) hpText.textContent = `${hp} / ${max}`;
    if(hpFill) hpFill.style.width = `${Math.max(0, Math.min(100, (hp / max) * 100))}%`;
    if(log) log.textContent = s.lastLog || "討伐開始！";
  }

  function popDamage(amount){
    const field = $("battleField");
    if(!field) return;
    const d = document.createElement("div");
    d.className = "battle-damage";
    d.textContent = `${amount} DAMAGE!`;
    field.appendChild(d);
    setTimeout(()=>d.remove(), 950);
  }

  function animateHit(defeated){
    const panel = $("battlePanel");
    if(!panel) return;
    panel.classList.remove("hit","defeated");
    void panel.offsetWidth;
    panel.classList.add(defeated ? "defeated" : "hit");
    setTimeout(()=>panel.classList.remove("hit","defeated"), defeated ? 850 : 420);
  }

  function applyDamage(amount, options){
    amount = Math.max(0, Number(amount || 0));
    if(amount <= 0){ render(); return; }

    options = options || {};
    const showMenu = typeof options.showMenu === "function" ? options.showMenu : null;
    const showOrders = typeof options.showOrders === "function" ? options.showOrders : null;

    if(showMenu) showMenu();
    render();

    let s = load();
    let rest = amount;
    let defeatedNames = [];
    let didDefeat = false;

    while(rest > 0 && s.index < ENEMIES.length){
      const e = current(s);
      if(!Number.isFinite(s.hp) || s.hp <= 0) s.hp = e.hp;

      if(rest >= s.hp){
        rest -= s.hp;
        defeatedNames.push(e.name);
        s.defeated.push({ id:e.id, name:e.name, at:new Date().toISOString() });
        s.index += 1;
        didDefeat = true;
        s.hp = s.index < ENEMIES.length ? ENEMIES[s.index].hp : 0;
      }else{
        s.hp -= rest;
        rest = 0;
      }
    }

    s.totalDamage = Number(s.totalDamage || 0) + amount;
    if(defeatedNames.length){
      s.lastLog = `${amount}ダメージ！ ${defeatedNames.join("、")}を撃破！`;
      if(rest > 0 && s.index < ENEMIES.length) s.lastLog += ` 余剰${rest}ダメージ！`;
    }else{
      s.lastLog = `${amount}ダメージ！`;
    }

    save(s);
    popDamage(amount);
    animateHit(didDefeat);
    setTimeout(render, didDefeat ? 820 : 360);
    if(showOrders) setTimeout(showOrders, didDefeat ? 1900 : 1400);
  }

  function resetRun(){
    save({ index:0, hp:ENEMIES[0].hp, defeated:[], totalDamage:0, lastLog:"討伐開始！" });
    render();
  }

  function init(){
    ensurePanel();
    render();
    document.addEventListener("click", ()=>setTimeout(render,80), true);
  }

  window.OtakubaBattle = { enemies: ENEMIES, render, applyDamage, resetRun, load };

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
