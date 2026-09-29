/**
 * ════════════════════════════════════════════════════════════════════════════
 * EXPEDILOG - GOOGLE APPS SCRIPT DATABASE ENGINE (Code.gs)
 * Backend Database Google Sheets untuk Sistem Manajemen Ekspedisi & Logistik
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * CARA MEMASANG DI GOOGLE SHEETS:
 * 1. Buka Google Spreadsheet baru di https://drive.google.com
 * 2. Klik menu "Ekstensi" > "Apps Script"
 * 3. Hapus seluruh kode bawaan di editor, lalu TEMPEL (PASTE) seluruh kode ini
 * 4. Klik ikon Simpan (Save 💾)
 * 5. Klik tombol biru "Deploy" (di kanan atas) > "New deployment"
 * 6. Klik ikon gerigi (Select type) > pilih "Web app"
 * 7. Isi:
 *    - Description: ExpediLog Database Cloud v1
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja - PENTING agar web app dapat terhubung)
 * 8. Klik "Deploy", beri izin akses Google jika diminta
 * 9. Salin "Web app URL" (yang berakhiran /exec)
 * 10. Buka ExpediLog > Menu Pengaturan > Tempelkan URL ke kolom Google Apps Script
 * ════════════════════════════════════════════════════════════════════════════
 */

const SHEET_NAMES = {
  RESI: 'Resi',
  NOTES: 'Catatan',
  PORTAL: 'Portal',
  SETTINGS: 'Pengaturan'
};

const RESI_HEADERS = [
  'id', 'nomorResi', 'namaClient', 'tanggalKirim', 'layanan', 'status',
  'kurir', 'slaRtn', 'slaEv', 'drsKe', 'biaya', 'keterangan',
  'pengirim_json', 'penerima_json', 'barang_json', 'riwayat_json', 'createdAt'
];

const NOTES_HEADERS = [
  'id', 'title', 'content', 'author', 'urgency', 'category', 'tags_json', 'createdAt', 'updatedAt'
];

const PORTAL_HEADERS = [
  'id', 'name', 'url', 'category', 'color', 'description', 'updatedAt'
];

const SETTINGS_HEADERS = ['key', 'value', 'updatedAt'];

/**
 * Endpoint HTTP GET (Digunakan untuk Ping, Tarik Data, dan JSONP)
 */
function doGet(e) {
  e = e || { parameter: {} };
  const params = e.parameter || {};
  const action = params.action || '';
  const callback = params.callback || '';

  // 1. Tes Koneksi (Ping)
  if (action === 'ping') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return createJsonResponse({
      success: true,
      message: 'ExpediLog Google Apps Script Database Online!',
      spreadsheetName: ss ? ss.getName() : 'Google Spreadsheet',
      timestamp: Date.now()
    }, callback);
  }

  // 2. Tarik Seluruh Data (getData)
  if (action === 'getData' || action === 'getAllData') {
    try {
      const allData = getAllInitialData();
      return createJsonResponse(Object.assign({ success: true, timestamp: Date.now() }, allData), callback);
    } catch(err) {
      return createJsonResponse({ success: false, message: err.toString() }, callback);
    }
  }

  // 3. Tampilan Dashboard Web jika URL dibuka langsung di browser
  return HtmlService.createHtmlOutput(getHtmlStatusPage())
    .setTitle('ExpediLog Database GAS Online')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Endpoint HTTP POST (Digunakan untuk Simpan, Sinkronisasi Masal, & Update)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch(parseErr) {
        payload = { action: 'syncAll' };
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || 'syncAll';

    // 1. Ping via POST
    if (action === 'ping') {
      return createJsonResponse({ success: true, message: 'Pong POST', timestamp: Date.now() });
    }

    // 2. Sinkronisasi Masal (syncAll / uploadAll)
    if (action === 'syncAll' || action === 'uploadAll') {
      const resiList = Array.isArray(payload.resiList) ? payload.resiList : [];
      const notesList = Array.isArray(payload.notesList) ? payload.notesList : [];
      const portalList = Array.isArray(payload.portalList) ? payload.portalList : [];
      const settings = payload.settings || {};

      let resiCount = 0;
      let notesCount = 0;
      let portalCount = 0;

      if (resiList.length > 0) resiCount = syncResiBatchToSheets(resiList);
      if (notesList.length > 0) notesCount = syncNotesToSheets(notesList);
      if (portalList.length > 0) portalCount = syncPortalsToSheets(portalList);

      if (settings && typeof settings === 'object') {
        for (const k in settings) {
          syncSettingToSheets(k, settings[k]);
        }
      }

      return createJsonResponse({
        success: true,
        message: 'Seluruh data berhasil disinkronkan ke Google Sheets',
        resiCount: resiCount,
        notesCount: notesCount,
        portalCount: portalCount,
        timestamp: Date.now()
      });
    }

    // 3. Sinkronisasi 1 Resi (syncSingle)
    if (action === 'syncSingleResi' || (action === 'syncSingle' && payload.table === 'resi')) {
      const item = payload.item || payload.resi;
      if (item) {
        syncSingleResi(item);
        return createJsonResponse({ success: true, message: 'Resi berhasil disinkronkan', id: item.id || item.nomorResi });
      }
    }

    // 4. Hapus Resi (deleteResi)
    if (action === 'deleteResi' || (action === 'delete' && payload.table === 'resi')) {
      const idOrIds = payload.id || payload.ids;
      deleteResiFromSheets(idOrIds);
      return createJsonResponse({ success: true, message: 'Resi berhasil dihapus' });
    }

    return createJsonResponse({ success: true, message: 'Aksi diproses' });
  } catch(err) {
    return createJsonResponse({ success: false, message: err.toString() });
  }
}

/**
 * Format output JSON atau JSONP
 */
function createJsonResponse(data, callback) {
  const jsonStr = JSON.stringify(data);
  if (callback && typeof callback === 'string' && /^[a-zA-Z0-9_]+$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + jsonStr + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ambil atau buat Sheet jika belum ada
 */
function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#10b981');
      sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * Tarik seluruh data dari Google Sheets (Resi, Catatan, Portal, Pengaturan)
 */
function getAllInitialData() {
  const resiList = getResiFromSheets();
  const notesList = getNotesFromSheets();
  const portalList = getPortalsFromSheets();
  const settings = getSettingsFromSheets();

  return {
    resiList: resiList,
    notesList: notesList,
    portalList: portalList,
    settings: settings
  };
}

/**
 * Membaca data Resi dari Sheet
 */
function getResiFromSheets() {
  const sheet = getOrCreateSheet(SHEET_NAMES.RESI, RESI_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, RESI_HEADERS.length).getValues();
  const result = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!row[0] && !row[1]) continue; // Lewati baris kosong

    let pengirim = {};
    let penerima = {};
    let barang = {};
    let riwayat = [];

    try { pengirim = JSON.parse(row[12] || '{}'); } catch(e) {}
    try { penerima = JSON.parse(row[13] || '{}'); } catch(e) {}
    try { barang = JSON.parse(row[14] || '{}'); } catch(e) {}
    try { riwayat = JSON.parse(row[15] || '[]'); } catch(e) {}

    result.push({
      id: String(row[0] || row[1]),
      nomorResi: String(row[1] || row[0]),
      namaClient: String(row[2] || (pengirim && pengirim.nama) || '-'),
      tanggalKirim: String(row[3] || ''),
      layanan: String(row[4] || 'Reguler'),
      status: String(row[5] || 'Manifest'),
      kurir: String(row[6] || '-'),
      slaRtn: String(row[7] || '-'),
      slaEv: String(row[8] || '-'),
      drsKe: parseInt(row[9] || 1, 10) || 1,
      biaya: Number(row[10] || 0),
      keterangan: String(row[11] || ''),
      pengirim: pengirim,
      penerima: penerima,
      barang: barang,
      riwayatStatus: riwayat,
      riwayat: riwayat,
      createdAt: Number(row[16] || Date.now())
    });
  }

  return result;
}

/**
 * Simpan seluruh array data Resi sekaligus ke Sheet (Cepat & Efisien)
 */
function syncResiBatchToSheets(resiList) {
  if (!Array.isArray(resiList) || resiList.length === 0) return 0;
  const sheet = getOrCreateSheet(SHEET_NAMES.RESI, RESI_HEADERS);

  const rows = [];
  for (let i = 0; i < resiList.length; i++) {
    const r = resiList[i];
    if (!r) continue;

    const id = String(r.id || r.nomorResi || ('R-' + Date.now() + '-' + i));
    const nomorResi = String(r.nomorResi || id);
    const namaClient = String(r.namaClient || (r.pengirim && r.pengirim.nama) || '-');
    const tanggalKirim = String(r.tanggalKirim || '');
    const layanan = String(r.layanan || 'Reguler');
    const status = String(r.status || 'Manifest');
    const kurir = String(r.kurir || '-');
    const slaRtn = String(r.slaRtn || '-');
    const slaEv = String(r.slaEv || '-');
    const drsKe = parseInt(r.drsKe || 1, 10) || 1;
    const biaya = Number(r.biaya || 0);
    const keterangan = String(r.keterangan || '');
    const pengirimJson = JSON.stringify(r.pengirim || {});
    const penerimaJson = JSON.stringify(r.penerima || {});
    const barangJson = JSON.stringify(r.barang || {});
    const riwayatJson = JSON.stringify(r.riwayatStatus || r.riwayat || []);
    const createdAt = Number(r.createdAt || Date.now());

    rows.push([
      id, nomorResi, namaClient, tanggalKirim, layanan, status,
      kurir, slaRtn, slaEv, drsKe, biaya, keterangan,
      pengirimJson, penerimaJson, barangJson, riwayatJson, createdAt
    ]);
  }

  if (rows.length === 0) return 0;

  // Bersihkan data lama, lalu tulis data baru (Atomic Batch Write)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, RESI_HEADERS.length).clearContent();
  }

  sheet.getRange(2, 1, rows.length, RESI_HEADERS.length).setValues(rows);
  return rows.length;
}

/**
 * Simpan / Update 1 Resi
 */
function syncSingleResi(r) {
  if (!r) return;
  const sheet = getOrCreateSheet(SHEET_NAMES.RESI, RESI_HEADERS);
  const id = String(r.id || r.nomorResi);

  const rowData = [
    id,
    String(r.nomorResi || id),
    String(r.namaClient || (r.pengirim && r.pengirim.nama) || '-'),
    String(r.tanggalKirim || ''),
    String(r.layanan || 'Reguler'),
    String(r.status || 'Manifest'),
    String(r.kurir || '-'),
    String(r.slaRtn || '-'),
    String(r.slaEv || '-'),
    parseInt(r.drsKe || 1, 10) || 1,
    Number(r.biaya || 0),
    String(r.keterangan || ''),
    JSON.stringify(r.pengirim || {}),
    JSON.stringify(r.penerima || {}),
    JSON.stringify(r.barang || {}),
    JSON.stringify(r.riwayatStatus || r.riwayat || []),
    Number(r.createdAt || Date.now())
  ];

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === id) {
        sheet.getRange(i + 2, 1, 1, RESI_HEADERS.length).setValues([rowData]);
        return;
      }
    }
  }

  sheet.appendRow(rowData);
}

/**
 * Hapus resi berdasarkan ID atau daftar ID
 */
function deleteResiFromSheets(idOrIds) {
  if (!idOrIds) return;
  const sheet = getOrCreateSheet(SHEET_NAMES.RESI, RESI_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const targetIds = Array.isArray(idOrIds) ? idOrIds.map(String) : [String(idOrIds)];
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  // Hapus dari baris terbawah ke atas agar index baris tidak bergeser
  for (let i = ids.length - 1; i >= 0; i--) {
    if (targetIds.includes(String(ids[i][0]))) {
      sheet.deleteRow(i + 2);
    }
  }
}

/**
 * Membaca data Catatan Tim
 */
function getNotesFromSheets() {
  const sheet = getOrCreateSheet(SHEET_NAMES.NOTES, NOTES_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, NOTES_HEADERS.length).getValues();
  const result = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;

    let tags = [];
    try { tags = JSON.parse(row[6] || '[]'); } catch(e) {}

    result.push({
      id: String(row[0]),
      title: String(row[1] || ''),
      content: String(row[2] || ''),
      author: String(row[3] || 'Tim Operasional'),
      urgency: String(row[4] || 'Biasa'),
      category: String(row[5] || 'Biasa'),
      tags: tags,
      createdAt: Number(row[7] || Date.now()),
      updatedAt: Number(row[8] || Date.now())
    });
  }

  return result;
}

/**
 * Simpan seluruh Catatan Tim ke Sheet
 */
function syncNotesToSheets(notesList) {
  if (!Array.isArray(notesList) || notesList.length === 0) return 0;
  const sheet = getOrCreateSheet(SHEET_NAMES.NOTES, NOTES_HEADERS);

  const rows = [];
  for (let i = 0; i < notesList.length; i++) {
    const n = notesList[i];
    if (!n) continue;

    rows.push([
      String(n.id || ('NOTE-' + Date.now() + '-' + i)),
      String(n.title || ''),
      String(n.content || ''),
      String(n.author || 'Tim Operasional'),
      String(n.urgency || 'Biasa'),
      String(n.category || 'Biasa'),
      JSON.stringify(Array.isArray(n.tags) ? n.tags : []),
      Number(n.createdAt || Date.now()),
      Number(n.updatedAt || Date.now())
    ]);
  }

  if (rows.length === 0) return 0;

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, NOTES_HEADERS.length).clearContent();
  }

  sheet.getRange(2, 1, rows.length, NOTES_HEADERS.length).setValues(rows);
  return rows.length;
}

/**
 * Membaca data Portal
 */
function getPortalsFromSheets() {
  const sheet = getOrCreateSheet(SHEET_NAMES.PORTAL, PORTAL_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, PORTAL_HEADERS.length).getValues();
  const result = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;

    result.push({
      id: String(row[0]),
      name: String(row[1] || ''),
      url: String(row[2] || ''),
      category: String(row[3] || 'Operasional'),
      color: String(row[4] || 'emerald'),
      description: String(row[5] || ''),
      updatedAt: Number(row[6] || Date.now())
    });
  }

  return result;
}

/**
 * Simpan data Portal ke Sheet
 */
function syncPortalsToSheets(portalList) {
  if (!Array.isArray(portalList) || portalList.length === 0) return 0;
  const sheet = getOrCreateSheet(SHEET_NAMES.PORTAL, PORTAL_HEADERS);

  const rows = [];
  for (let i = 0; i < portalList.length; i++) {
    const p = portalList[i];
    if (!p) continue;

    rows.push([
      String(p.id || ('SYS-' + Date.now() + '-' + i)),
      String(p.name || ''),
      String(p.url || ''),
      String(p.category || 'Operasional'),
      String(p.color || 'emerald'),
      String(p.description || ''),
      Number(p.updatedAt || Date.now())
    ]);
  }

  if (rows.length === 0) return 0;

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, PORTAL_HEADERS.length).clearContent();
  }

  sheet.getRange(2, 1, rows.length, PORTAL_HEADERS.length).setValues(rows);
  return rows.length;
}

/**
 * Membaca pengaturan dari Sheet
 */
function getSettingsFromSheets() {
  const sheet = getOrCreateSheet(SHEET_NAMES.SETTINGS, SETTINGS_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};

  const values = sheet.getRange(2, 1, lastRow - 1, SETTINGS_HEADERS.length).getValues();
  const settings = {};

  for (let i = 0; i < values.length; i++) {
    const key = String(values[i][0] || '');
    if (key) {
      settings[key] = values[i][1];
    }
  }

  return settings;
}

/**
 * Menyimpan 1 baris pengaturan ke Sheet
 */
function syncSettingToSheets(key, value) {
  if (!key) return;
  const sheet = getOrCreateSheet(SHEET_NAMES.SETTINGS, SETTINGS_HEADERS);
  const keyStr = String(key);
  const valStr = String(value || '');

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === keyStr) {
        sheet.getRange(i + 2, 2, 1, 2).setValues([[valStr, Date.now()]]);
        return;
      }
    }
  }

  sheet.appendRow([keyStr, valStr, Date.now()]);
}

/**
 * Halaman Status HTML Informatif saat Web App URL dibuka di browser
 */
function getHtmlStatusPage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ssName = ss ? ss.getName() : 'Google Spreadsheet';
  const resiCount = ss && ss.getSheetByName(SHEET_NAMES.RESI) ? Math.max(0, ss.getSheetByName(SHEET_NAMES.RESI).getLastRow() - 1) : 0;
  const notesCount = ss && ss.getSheetByName(SHEET_NAMES.NOTES) ? Math.max(0, ss.getSheetByName(SHEET_NAMES.NOTES).getLastRow() - 1) : 0;
  const portalCount = ss && ss.getSheetByName(SHEET_NAMES.PORTAL) ? Math.max(0, ss.getSheetByName(SHEET_NAMES.PORTAL).getLastRow() - 1) : 0;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ExpediLog GAS Database Online</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1528; color: #f8fafc; margin: 0; padding: 30px 16px; display: flex; justify-content: center; }
    .card { background: #112240; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 20px; max-width: 580px; width: 100%; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 99px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-size: 12px; font-weight: 700; margin-bottom: 14px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
    h1 { font-size: 20px; margin: 0 0 8px 0; color: #f8fafc; }
    p { font-size: 13.5px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px 0; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
    .stat-box { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 12px; padding: 12px; text-align: center; }
    .stat-val { font-size: 20px; font-weight: 800; color: #00e5ff; }
    .stat-lbl { font-size: 11px; color: #64748b; margin-top: 4px; }
    .guide { background: rgba(2, 132, 199, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 14px 18px; font-size: 12.5px; color: #cbd5e1; line-height: 1.6; }
    .guide strong { color: #38bdf8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Web App Aktif &amp; Terhubung</div>
    <h1>⚡ ExpediLog Database Google Apps Script</h1>
    <p>Endpoint database Google Sheets berhasil di-deploy dan siap melayani permintaan data aplikasi ExpediLog.</p>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-val">${resiCount}</div>
        <div class="stat-lbl">Data Resi</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${notesCount}</div>
        <div class="stat-lbl">Catatan Tim</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${portalCount}</div>
        <div class="stat-lbl">Portal Sistem</div>
      </div>
    </div>

    <div class="guide">
      <strong>Langkah Selanjutnya:</strong><br>
      Salin URL web app dari browser ini (yang berakhiran <code>/exec</code>), lalu buka aplikasi <strong>ExpediLog</strong> &gt; menu <strong>Pengaturan</strong> &gt; tempelkan ke kolom <strong>URL Google Apps Script Web App</strong>.
    </div>
  </div>
</body>
</html>`;
}
