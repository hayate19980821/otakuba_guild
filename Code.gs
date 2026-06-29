const WEBHOOK = https://discord.com/api/webhooks/1520597320360661022/6-RxzLWy71uYeHJEF9cs6P4okOMJd8PLp26g9CIHRYzZE4qk7Q8ZjiYFeaTge-qe8pGx
const SPREADSHEET_ID = "";

function doGet(e) {
  const action = e?.parameter?.action || "";
  try {
    if (action === "summary") {
      return json_(getMonthlySummary_(e.parameter.month || monthKey_(new Date())));
    }
    if (action === "listOrders") {
      return json_(listOrders_(e.parameter.month || monthKey_(new Date())));
    }
    return ContentService
      .createTextOutput("おたく場ギルド GAS API 起動中")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e?.postData?.contents || "{}");
    const action = data.action || data.type || "order";

    if (action === "listOrders") return json_(listOrders_(data.month));
    if (action === "updateQty") return json_(updateQty_(data));
    if (action === "cancelItem") return json_(cancelItem_(data));
    if (action === "cancelOrder") return json_(cancelOrder_(data));
    if (action === "markReceived") return json_(markReceived_(data));

    const saved = saveOrderToSheet_(data);
    sendDiscord_(data, saved);
    return json_({ ok: true, ...saved });
  } catch (err) {
    Logger.log(String(err));
    return json_({ ok: false, error: String(err) });
  }
}

function saveOrderToSheet_(data) {
  const ss = getSpreadsheet_();
  const now = new Date();
  const month = monthKey_(now);
  const timeText = data.time || Utilities.formatDate(now, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
  const orderId = data.orderId || Utilities.getUuid();
  const items = (Array.isArray(data.items) ? data.items : []).map(function(item) {
    return {
      itemId: item.itemId || Utilities.getUuid(),
      name: item.name || "商品名なし",
      price: Number(item.price || 0),
      qty: Number(item.qty || 1),
      subtotal: Number(item.subtotal || (Number(item.price || 0) * Number(item.qty || 1))),
      status: "active"
    };
  });

  const total = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

  const orderSheet = getOrCreateSheet_(ss, month + "_注文", [
    "記録日時", "注文ID", "状態", "種別", "冒険者ID", "名前", "二つ名",
    "Lv", "来店回数", "人数", "合計G", "商品JSON", "キャンセル理由", "更新日時"
  ]);

  orderSheet.appendRow([
    timeText,
    orderId,
    "active",
    data.type || "order",
    data.adventurerId || "",
    data.adventurer || data.name || "未登録",
    data.title || "",
    Number(data.level || 1),
    Number(data.visits || 0),
    Number(data.partyCount || 1),
    total,
    JSON.stringify(items),
    "",
    timeText
  ]);

  const itemSheet = getOrCreateSheet_(ss, month + "_商品", [
    "記録日時", "注文ID", "商品ID", "状態", "冒険者ID", "名前",
    "商品名", "単価", "数量", "小計G", "キャンセル理由", "更新日時"
  ]);

  items.forEach(function(item) {
    itemSheet.appendRow([
      timeText,
      orderId,
      item.itemId,
      "active",
      data.adventurerId || "",
      data.adventurer || data.name || "未登録",
      item.name,
      item.price,
      item.qty,
      item.subtotal,
      "",
      timeText
    ]);
  });

  return { ok: true, month, spreadsheetUrl: ss.getUrl(), orderId };
}

function listOrders_(month) {
  const ss = getSpreadsheet_();
  month = month || monthKey_(new Date());
  const sheet = ss.getSheetByName(month + "_注文");
  if (!sheet) return { ok: true, month, orders: [], spreadsheetUrl: ss.getUrl() };

  const values = sheet.getDataRange().getValues();
  const orders = [];

  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    let items = [];
    try { items = JSON.parse(r[11] || "[]"); } catch (e) { items = []; }

    orders.push({
      row: i + 1,
      time: r[0],
      orderId: r[1],
      status: r[2],
      type: r[3],
      adventurerId: r[4],
      adventurer: r[5],
      title: r[6],
      level: r[7],
      visits: r[8],
      partyCount: r[9],
      total: r[10],
      items,
      cancelReason: r[12],
      updatedAt: r[13]
    });
  }

  return { ok: true, month, orders: orders.reverse(), spreadsheetUrl: ss.getUrl() };
}

function updateQty_(data) {
  const ctx = findOrder_(data);
  const itemId = data.itemId;
  const qty = Math.max(0, Number(data.qty || 0));
  const reason = data.reason || "数量変更";

  const item = ctx.items.find(x => x.itemId === itemId);
  if (!item) return { ok: false, error: "商品が見つかりません" };

  if (qty <= 0) {
    item.status = "cancelled";
    item.qty = 0;
    item.subtotal = 0;
    item.cancelReason = reason;
  } else {
    item.qty = qty;
    item.subtotal = Number(item.price || 0) * qty;
  }

  saveOrderUpdate_(ctx, reason);
  appendCancelLog_("updateQty", ctx, item, reason);
  return { ok: true };
}

function cancelItem_(data) {
  const ctx = findOrder_(data);
  const itemId = data.itemId;
  const reason = data.reason || "商品取消";

  const item = ctx.items.find(x => x.itemId === itemId);
  if (!item) return { ok: false, error: "商品が見つかりません" };

  item.status = "cancelled";
  item.cancelReason = reason;
  item.subtotal = 0;

  saveOrderUpdate_(ctx, reason);
  appendCancelLog_("cancelItem", ctx, item, reason);
  return { ok: true };
}

function cancelOrder_(data) {
  const ctx = findOrder_(data);
  const reason = data.reason || "注文全キャンセル";

  ctx.items.forEach(function(item) {
    item.status = "cancelled";
    item.cancelReason = reason;
    item.subtotal = 0;
  });
  ctx.status = "cancelled";

  saveOrderUpdate_(ctx, reason);
  appendCancelLog_("cancelOrder", ctx, null, reason);
  return { ok: true };
}

function markReceived_(data) {
  const ctx = findOrder_(data);
  ctx.status = "received";
  saveOrderUpdate_(ctx, data.reason || "受領済み");
  return { ok: true };
}

function findOrder_(data) {
  const ss = getSpreadsheet_();
  const month = data.month || monthKey_(new Date());
  const sheet = ss.getSheetByName(month + "_注文");
  if (!sheet) throw new Error("注文シートがありません");

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === data.orderId) {
      let items = [];
      try { items = JSON.parse(values[i][11] || "[]"); } catch (e) { items = []; }
      return {
        ss,
        sheet,
        month,
        row: i + 1,
        values: values[i],
        orderId: values[i][1],
        status: values[i][2],
        items
      };
    }
  }
  throw new Error("注文が見つかりません");
}

function saveOrderUpdate_(ctx, reason) {
  const now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
  const total = ctx.items
    .filter(x => x.status !== "cancelled")
    .reduce((sum, x) => sum + Number(x.subtotal || 0), 0);

  ctx.sheet.getRange(ctx.row, 3).setValue(ctx.status || "active");
  ctx.sheet.getRange(ctx.row, 11).setValue(total);
  ctx.sheet.getRange(ctx.row, 12).setValue(JSON.stringify(ctx.items));
  ctx.sheet.getRange(ctx.row, 13).setValue(reason || "");
  ctx.sheet.getRange(ctx.row, 14).setValue(now);

  syncItemSheet_(ctx, now, reason);
}

function syncItemSheet_(ctx, now, reason) {
  const sheet = getOrCreateSheet_(ctx.ss, ctx.month + "_商品", [
    "記録日時", "注文ID", "商品ID", "状態", "冒険者ID", "名前",
    "商品名", "単価", "数量", "小計G", "キャンセル理由", "更新日時"
  ]);

  const values = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === ctx.orderId) map[values[i][2]] = i + 1;
  }

  ctx.items.forEach(function(item) {
    const row = map[item.itemId];
    if (row) {
      sheet.getRange(row, 4).setValue(item.status || "active");
      sheet.getRange(row, 9).setValue(Number(item.qty || 0));
      sheet.getRange(row, 10).setValue(Number(item.subtotal || 0));
      sheet.getRange(row, 11).setValue(item.cancelReason || reason || "");
      sheet.getRange(row, 12).setValue(now);
    }
  });
}

function appendCancelLog_(type, ctx, item, reason) {
  const sheet = getOrCreateSheet_(ctx.ss, ctx.month + "_取消履歴", [
    "日時", "処理", "注文ID", "商品ID", "商品名", "理由"
  ]);
  sheet.appendRow([
    Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss"),
    type,
    ctx.orderId,
    item ? item.itemId : "",
    item ? item.name : "注文全体",
    reason || ""
  ]);
}

function getMonthlySummary_(month) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(month + "_商品");
  if (!sheet) return { ok: true, month, total: 0, items: [] };

  const values = sheet.getDataRange().getValues();
  const map = {};
  let total = 0;

  for (let i = 1; i < values.length; i++) {
    const status = values[i][3];
    if (status === "cancelled") continue;

    const name = values[i][6] || "商品名なし";
    const qty = Number(values[i][8] || 0);
    const subtotal = Number(values[i][9] || 0);

    if (!map[name]) map[name] = { name, qty: 0, total: 0 };
    map[name].qty += qty;
    map[name].total += subtotal;
    total += subtotal;
  }

  return {
    ok: true,
    month,
    total,
    items: Object.keys(map).map(k => map[k]).sort((a, b) => b.total - a.total),
    spreadsheetUrl: ss.getUrl()
  };
}

function sendDiscord_(data, saved) {
  if (!WEBHOOK || WEBHOOK.indexOf("discord.com/api/webhooks") === -1) return;

  const items = Array.isArray(data.items) ? data.items : [];
  const lines = items.length ? items.map(function(item) {
    return "・" + (item.name || "商品名なし") + " ×" + Number(item.qty || 1) + "（" + Number(item.subtotal || 0) + "G）";
  }).join("\n") : "・注文なし";

  let kind = "📜 新しいクエスト受注";
  if (data.type === "additional") kind = "📜 追加クエスト";
  if (data.type === "checkout") kind = "🏁 クエスト達成（会計）";

  const content =
    "【" + saved.month + " 注文履歴】\n" +
    kind + "\n\n" +
    "👤 冒険者：\n" +
    (data.title ? data.title + "\n" : "") +
    (data.adventurer || data.name || "未登録") + "\n" +
    "ID：" + (data.adventurerId || "ID未発行") + "\n" +
    "Lv." + Number(data.level || 1) +
    " / 来店 " + Number(data.visits || 0) +
    "回 / 人数 " + Number(data.partyCount || 1) + "名\n\n" +
    lines + "\n\n" +
    "💰 合計：" + Number(data.total || 0) + "G\n" +
    "🕒 " + (data.time || new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })) + "\n" +
    "📊 月別シート：" + saved.month;

  UrlFetchApp.fetch(WEBHOOK, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ content }),
    muteHttpExceptions: true
  });
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = SPREADSHEET_ID || props.getProperty("OTAKUBA_SALES_SPREADSHEET_ID");

  if (id) return SpreadsheetApp.openById(id);

  const ss = SpreadsheetApp.create("おたく場ギルド_売上履歴");
  props.setProperty("OTAKUBA_SALES_SPREADSHEET_ID", ss.getId());
  return ss;
}

function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function monthKey_(date) {
  return Utilities.formatDate(date, "Asia/Tokyo", "yyyy-MM");
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function testDiscord() {
  sendDiscord_({
    type: "order",
    adventurerId: "ADV-TEST",
    adventurer: "テスト冒険者",
    level: 1,
    visits: 0,
    partyCount: 2,
    items: [{ name: "テストドリンク", price: 500, qty: 2, subtotal: 1000 }],
    total: 1000,
    time: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
  }, { month: monthKey_(new Date()) });
}

function testSheet() {
  const result = saveOrderToSheet_({
    type: "order",
    adventurerId: "ADV-TEST",
    adventurer: "テスト冒険者",
    level: 1,
    visits: 0,
    partyCount: 2,
    items: [{ name: "テストドリンク", price: 500, qty: 2, subtotal: 1000 }],
    total: 1000,
    time: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
  });
  Logger.log(result.spreadsheetUrl);
}