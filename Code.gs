var SHEET_NAME = "DataODC";

var FOLDER_IDS = {
  'linkGov': '1cL07T4gQUcV8T_qt9i2xLQewcJc7XxU3',
  'linkCom': '1J5TWiQOrmzirNVnxudV6XnFXulz4T6mz',
  'linkSitac': '1VoVMxxDgObDWxqGfE57eekjCVkZMi_hs',
  'linkPay': '1YCZkNBthZGs76ew9KGNSrXH9GeuiQFEe',
  'fotoDalam': 'ISI_ID_FOLDER_FOTO_DALAM',
  'fotoLuar': 'ISI_ID_FOLDER_FOTO_LUAR'
};

var FIELD_MAP = {
  'namaPemilik': ['nama pemilik', 'pemilik lahan', 'pic', 'nama pemilik / pic lahan'],
  'linkGov': ['izin pemerintah', 'linkgov', 'link_gov'],
  'linkCom': ['izin masyarakat', 'linkcom', 'link_com'],
  'linkSitac': ['sitac', 'linksitac', 'link_sitac'],
  'linkPay': ['kwitansi pembayaran', 'linkpay', 'link_pay'],
  'fotoDalam': ['foto odc dalam'],
  'fotoLuar': ['foto odc luar'],
  'expSitac': ['masa berlaku sitac', 'expsitac', 'exp'],
  'tipeBiaya': ['tipe biaya', 'kategori biaya', 'biaya']
};

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return out_({error: "Sheet tidak ditemukan"});

  var tz = Session.getScriptTimeZone();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var result = data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      if (!h) return;
      var v = row[i];
      if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      obj[String(h).trim().toLowerCase()] = v;
    });
    return obj;
  });
  return out_(result);
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    if (d.action === 'delete' && d.odc && d.field) {
      tulisSel_(d.odc, d.field, '');
      return out_({status: "success", message: "Dokumen berhasil dihapus"});
    }

    if (d.fileData && d.fileName) {
      var r = simpanBerkas_(d.odc, d.field, d.fileData, d.fileName, d.mimeType);
      return out_({status: "success", fileId: r.fileId, fileUrl: r.fileUrl});
    }

    if (d.odc && d.field) {
      tulisSel_(d.odc, d.field, String(d.value || ''));
      return out_({status: "success"});
    }

    return out_({status: "success", message: "Data diterima"});
  } catch (err) {
    return out_({status: "error", message: err.toString()});
  }
}

function simpanBerkas_(odc, field, dataUrl, fileName, mimeType) {
  if (!FIELD_MAP[field]) throw new Error("Field tidak dikenal: " + field);
  var folderId = FOLDER_IDS[field];
  var folder = (folderId && folderId.indexOf('ISI_ID') !== 0)
    ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();

  var b64 = dataUrl.indexOf(',') > -1 ? dataUrl.split(',')[1] : dataUrl;
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), mimeType || 'application/octet-stream', fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var url = file.getUrl();
  if (odc) tulisSel_(odc, field, url);
  return {fileId: file.getId(), fileUrl: url};
}

function tulisSel_(odc, field, value) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0].map(function(h) { return String(h).trim().toLowerCase(); });
    var odcIdx = headers.indexOf("odc");
    var colIdx = -1;
    (FIELD_MAP[field] || []).forEach(function(n) {
      if (colIdx === -1) colIdx = headers.indexOf(n);
    });
    if (odcIdx === -1) throw new Error("Kolom ODC tidak ada");
    if (colIdx === -1) throw new Error("Kolom untuk '" + field + "' tidak ada di sheet.");

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][odcIdx]).trim().toUpperCase() === String(odc).trim().toUpperCase()) {
        var cell = sheet.getRange(i + 1, colIdx + 1);
        if (field === 'expSitac') cell.setNumberFormat('@');
        cell.setValue(value);
        return;
      }
    }
    throw new Error("ODC tidak ditemukan: " + odc);
  } finally {
    lock.releaseLock();
  }
}

function triggerDrivePermission() {
  DriveApp.getRootFolder();
}
