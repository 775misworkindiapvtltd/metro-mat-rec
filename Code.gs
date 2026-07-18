/**
 * MATERIAL RECEIVING — Standalone Web App (Google Apps Script)
 * ALL function names end with "AI" to avoid conflict with other code files.
 */

/* =========================================================================
 * IMPORTANT: PASTE YOUR GOOGLE SHEET ID BELOW (between the quotes)
 * How to find it: Open your MATERIAL RECIEVING Google Sheet. Look at the URL:
 *   docs.google.com/spreadsheets/d/THIS_LONG_ID_HERE/edit
 * Copy the part between /d/ and /edit and paste it below.
 * (Pre-filled from your URL — verify it matches your sheet.)
 * ========================================================================= */
var SPREADSHEET_ID_AI = '12a2i4ZtPRu_A6KpBNKPA-B3QkEal3CQgn9LTH2Lv1A';

/* ---- Sheet name constants ---- */
var SHEETS_AI = {
  login:      'LOGIN PAGE',
  matRecResp: 'MATERIAL REC RESPONSES',
  poReceived: 'PO RECIEVED'
};

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Material Receiving')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Get the spreadsheet — works for BOTH bound and standalone scripts.
// Uses openById (reliable in web app /exec context) with getActiveSpreadsheet fallback.
function getSSAI() {
  if (SPREADSHEET_ID_AI && SPREADSHEET_ID_AI.length > 20) {
    try { return SpreadsheetApp.openById(SPREADSHEET_ID_AI); } catch (e) {}
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheetToObjectsAI(name) {
  var ss = getSSAI();
  if (!ss) return [];
  var sh = ss.getSheetByName(name);
  if (!sh) {
    var allSheets = ss.getSheets().map(function(s){return s.getName();});
    var target = name.toUpperCase().replace(/\s+/g,'');
    for (var i = 0; i < allSheets.length; i++) {
      if (allSheets[i].toUpperCase().replace(/\s+/g,'') === target) {
        sh = ss.getSheetByName(allSheets[i]);
        break;
      }
    }
  }
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  var rawHeaders = data[0].map(function (h) { return String(h).replace(/\s+/g, ' ').trim(); });
  var headerCount = {};
  var headers = rawHeaders.map(function(h) {
    if (!h) h = '_BLANK_';
    if (!headerCount[h]) { headerCount[h] = 1; return h; }
    headerCount[h]++;
    return h + '_' + headerCount[h];
  });
  return data.slice(1)
    .filter(function (row) { return row.some(function (c) { return c !== ''; }); })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
}

function fmtTimestampAI(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd-MMM-yyyy HH:mm:ss');
  return (v === undefined || v === null) ? '' : v;
}
function fmtDateOnlyAI(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
  return (v === undefined || v === null) ? '' : v;
}
function fmtValueAI(v) { return (v === undefined || v === null) ? '' : v; }
function isYesAI(v) { return String(v || '').trim().toUpperCase() === 'YES'; }

function pickAI(r, names) {
  for (var i = 0; i < names.length; i++) {
    if (Object.prototype.hasOwnProperty.call(r, names[i])) return r[names[i]];
  }
  var keys = Object.keys(r);
  for (var i = 0; i < names.length; i++) {
    var target = names[i].replace(/\s+/g, ' ').trim().toUpperCase();
    for (var j = 0; j < keys.length; j++) {
      if (keys[j].replace(/\s+/g, ' ').trim().toUpperCase() === target) return r[keys[j]];
    }
  }
  return '';
}

function mapUserAI(r) {
  return {
    name: r['NAME'] || '', id: String(r['ID'] || '').trim(), password: String(r['PASSWORD'] || '').trim(),
    matRecView: isYesAI(pickAI(r, ['MATERIAL RECEIVED VIEW ENTRY'])),
    matRecAdd:  isYesAI(pickAI(r, ['MATERIAL ENTRY ADD'])),
    poReceived: isYesAI(pickAI(r, ['PO RECEIVED', 'PO RECIEVED']))
  };
}

function mapMatRecAI(rows) {
  return rows.map(function (r) {
    return {
      timestamp: fmtTimestampAI(r['TIMESTAMP']),
      poNo: fmtValueAI(r['PO NO']),
      invoiceUpload: fmtValueAI(r['INVOICE UPLOAD']),
      vendorName: fmtValueAI(r['VENDOR NAME']),
      pendingQtyTop: fmtValueAI(r['PENDING QTY']),
      invQty: fmtValueAI(r['INV QTY']),
      dueDate: fmtDateOnlyAI(r['DUE DATE']),
      bandel: fmtValueAI(r['BANDEL']),
      addressGst: fmtValueAI(r['ADDRESS & GST NUMBER VERIFICATION']),
      ewayBill: fmtValueAI(r['EWAY BILL VERIFICATION']),
      lrBillVerified: fmtValueAI(r['LR BILL VERIFIED']),
      invoiceNumber: fmtValueAI(r['Invoice number']),
      invoiceDate: fmtDateOnlyAI(r['invoice date']),
      ewayBillImage: fmtValueAI(r['EWAY BILL VERIFICATION IMAGE']),
      changeBrand: fmtValueAI(r['CHANGE BRAND']),
      brand: fmtValueAI(r['BRAND']),
      salesOrderId: fmtValueAI(r['SALES ORDER ID']),
      itemName: fmtValueAI(r['ITEM NAME']),
      pendingQty: fmtValueAI(r['PENDING QTY']),
      recQty: fmtValueAI(r['REC QTY']),
      cancelQty: fmtValueAI(r['CANCEL QTY']),
      poRate: fmtValueAI(r['PO RATE']),
      size: fmtValueAI(r['SIZE']),
      unit: fmtValueAI(r['UNIT']),
      invoiceRate: fmtValueAI(r['INVOICE RATE']),
      inwardBatchNo: fmtValueAI(r['INWARD BATCH NO']),
      grossWeight: fmtValueAI(r['GROSS WEIGHT']),
      remarks: fmtValueAI(r['REMARKS']),
      newUniqueNo: fmtValueAI(r['NEW UNIQUE NO']),
      outwardBatchNo: fmtValueAI(r['OUTWARD BATCH NO']),
      matRecImage: fmtValueAI(r['MATRIAL REC IMAGE MULTIPLE IMAGE']),
      status: fmtValueAI(r['STATUS']),
      loginName: fmtValueAI(r['LOGIN NAME'] || r['LOGIN ID'] || '')
    };
  });
}

function mapPoReceivedAI(rows) {
  return rows.map(function (r) {
    var keys = Object.keys(r);
    var obj = {};
    keys.forEach(function(k) { obj[k] = fmtValueAI(r[k]); });
    if (r['TIMESTAMP'] instanceof Date) obj['TIMESTAMP'] = fmtTimestampAI(r['TIMESTAMP']);
    if (r['Dated'] instanceof Date) obj['Dated'] = fmtDateOnlyAI(r['Dated']);
    if (r['Due on'] instanceof Date) obj['Due on'] = fmtDateOnlyAI(r['Due on']);
    if (r['Due Date'] instanceof Date) obj['Due Date'] = fmtDateOnlyAI(r['Due Date']);
    return obj;
  });
}

function getUserPermissionsAI(id) {
  var usersRaw = sheetToObjectsAI(SHEETS_AI.login);
  var match = usersRaw.find(function (r) { return String(r['ID'] || '').trim().toLowerCase() === String(id || '').trim().toLowerCase(); });
  if (!match) return null;
  var u = mapUserAI(match);
  delete u.password;
  return u;
}

function getLoginDataAI() {
  var usersRaw = sheetToObjectsAI(SHEETS_AI.login);
  return { users: usersRaw.map(mapUserAI) };
}

function getBootstrapDataAI(perms) {
  var result = {
    matRecResp: [],
    poReceived: [],
    users: [],
    missingSheets: []
  };

  var loadAll = !perms;
  // MATERIAL REC RESPONSES loads only if user has MATERIAL RECEIVED VIEW ENTRY or MATERIAL ENTRY ADD = YES
  var needMatRec = loadAll || perms.matRecView || perms.matRecAdd;
  // PO RECIEVED loads only if user has PO RECEIVED = YES
  var needPoRec = loadAll || perms.poReceived;

  if (needMatRec) {
    try { result.matRecResp = mapMatRecAI(sheetToObjectsAI(SHEETS_AI.matRecResp)); } catch(e) { result.missingSheets.push(SHEETS_AI.matRecResp + ' (error: ' + e.message + ')'); }
  }
  if (needPoRec) {
    try { result.poReceived = mapPoReceivedAI(sheetToObjectsAI(SHEETS_AI.poReceived)); } catch(e) { result.missingSheets.push(SHEETS_AI.poReceived + ' (error: ' + e.message + ')'); }
  }
  try { result.users = sheetToObjectsAI(SHEETS_AI.login).map(mapUserAI); } catch(e) { result.missingSheets.push(SHEETS_AI.login + ' (error: ' + e.message + ')'); }

  return result;
}

function saveMatRecEntriesAI(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (!payload) return { status: 'error', message: 'No data received.' };

    var perms = getUserPermissionsAI(payload.loginId || '');
    if (!perms || !perms.matRecAdd) return { status: 'error', message: 'You do not have permission to add Material Received entries.' };

    var ss = getSSAI();
    var sh = ss.getSheetByName(SHEETS_AI.matRecResp);
    if (!sh) return { status: 'error', message: 'Sheet not found: ' + SHEETS_AI.matRecResp };

    var top = payload.topFields || {};
    var rows = payload.rows || [];
    if (!rows.length) return { status: 'error', message: 'No item rows to save.' };

    var now = new Date();
    var ts = fmtTimestampAI(now);
    var loginName = payload.loginName || '';

    var dataRows = rows.map(function (r) {
      return [
        ts, top.poNo||'', top.invoiceUpload||'', top.vendorName||'', top.pendingQtyTop||'',
        top.invQty||'', top.dueDate||'', top.bandel||'', top.addressGst||'', top.ewayBill||'',
        top.lrBillVerified||'', top.invoiceNumber||'', top.invoiceDate||'', top.ewayBillImage||'',
        r.changeBrand||'', r.brand||'', r.salesOrderId||'', r.itemName||'',
        r.pendingQty||'', r.recQty||'', r.cancelQty||'', r.poRate||'',
        r.size||'', r.unit||'', r.invoiceRate||'', r.inwardBatchNo||'',
        r.grossWeight||'', r.remarks||'', r.newUniqueNo||'', r.outwardBatchNo||'',
        r.matRecImage||'', loginName
      ];
    });

    sh.getRange(sh.getLastRow() + 1, 1, dataRows.length, 32).setValues(dataRows);
    return { status: 'ok', saved: dataRows.length };
  } catch (err) {
    return { status: 'error', message: err.message };
  } finally {
    lock.releaseLock();
  }
}

function debugPoHeadersAI() {
  var ss = getSSAI();
  if (!ss) { Logger.log('ERROR: Could not open spreadsheet! Check SPREADSHEET_ID_AI at top of file.'); return; }
  Logger.log('Spreadsheet opened: ' + ss.getName());
  Logger.log('All tabs: ' + ss.getSheets().map(function(s){return s.getName();}).join(', '));
  var sh = ss.getSheetByName('PO RECIEVED') || ss.getSheetByName('PO RECEIVED');
  if (!sh) { Logger.log('PO sheet not found!'); return; }
  var data = sh.getDataRange().getValues();
  Logger.log('PO RECIEVED total rows: ' + data.length);
  Logger.log('Headers: ' + JSON.stringify(data[0].map(function(h,i){return 'Col'+(i+1)+':['+String(h).replace(/\s+/g,' ').trim()+']';})));
}
