window.GuildAudio = (() => {
  const bgm = {
    title: "冒険への誘い.mp3",
    slime: "maou_bgm_fantasy15.mp3",
    goblin: "Baring_Their_Fangs.mp3",
    orc: "反撃の一矢.mp3",
    cave: "Rumbling.mp3",
    ruins: "龍太鼓.mp3",
    maou: "Extinguish.mp3",
    ending: "March_for__delightful_future.mp3"
  };
  const se = {
    ok: "maou_se_system37.mp3",
    cancel: "maou_se_system49.mp3",
    add: "maou_se_onepoint16.mp3",
    hit: "maou_se_onepoint20.mp3",
    defeat: "maou_se_system49.mp3",
    levelup: "レベルアップ.mp3",
    fanfare: "ファンファーレ.mp3"
  };
  let currentKey = "";
  let current = null;
  let bgmVolume = 0.45;
  let seVolume = 0.8;
  function make(src, loop=false, volume=1){ const a = new Audio(src); a.loop = loop; a.preload = "auto"; a.volume = volume; return a; }
  async function playBgm(key){
    const src = bgm[key]; if(!src || currentKey === key) return;
    stopBgm(); currentKey = key; current = make(src, true, bgmVolume);
    try{ await current.play(); }catch(e){}
  }
  function stopBgm(){ if(current){ try{ current.pause(); current.currentTime = 0; }catch(e){} } current = null; currentKey = ""; }
  function playSe(key){ const src = se[key]; if(!src) return; try{ const a = make(src, false, seVolume); a.play().catch(()=>{}); }catch(e){} }
  function play(key){ playSe(key); }
  function setVolume(type, v){ v = Math.max(0, Math.min(1, Number(v)||0)); if(type === "bgm"){ bgmVolume = v; if(current) current.volume = v; } else seVolume = v; }
  function bgmForEnemy(enemy){ if(!enemy) return "title"; if(enemy.bgm) return enemy.bgm; const id = String(enemy.id||""); if(id.includes("slime")) return "slime"; if(id.includes("goblin") || id.includes("minotaur")) return "goblin"; if(id.includes("orc") || id.includes("dragon")) return "orc"; if(id.includes("skeleton") || id.includes("mimic")) return "cave"; if(id.includes("gargoyle") || id.includes("wizard")) return "ruins"; if(id.includes("maou")) return "maou"; return "goblin"; }
  return { playBgm, stopBgm, playSe, play, setVolume, bgmForEnemy };
})();
