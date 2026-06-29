おたく場ギルド v3.0 split-managed

目的:
- 巨大な index.html を直接編集しなくていいように分割
- 一般画面のHTML/CSS/JSを分離
- battle.js / audio.js を独立管理
- data フォルダに JSON を保管

主な構成:
index.html
admin.html
css/main.css
css/menu.css
css/battle.css
css/effects.css
css/admin.css
js/main.js
js/battle.js
js/audio.js
js/storage.js
js/menu.js
js/discord.js
data/menu.json
data/monsters.json
data/settings.json

注意:
- 現在の一般画面は最新 index(29).html を元に分割しています。
- 注文確定時にダメージ、会計はダメージなしへ補強済み。
- 画像・音源は既存コード互換のためリポジトリ直下に置く構成です。
- GitHub Pages では index.html?v=3.0-split-managed で確認してください。
