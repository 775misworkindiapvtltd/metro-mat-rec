/**
 * MATERIAL RECEIVING — Standalone Web App (Google Apps Script)
 * Files in this Apps Script project:
 *   Code.gs      (this file)
 *   Index.html   (the UI file)
 *
 * Required sheet tabs:
 *   LOGIN PAGE              -> NAME | ID | PASSWORD | MATERIAL RECEIVED VIEW ENTRY | MATERIAL ENTRY ADD
 *   MATERIAL REC RESPONSES  -> TIMESTAMP | PO NO | INVOICE UPLOAD | VENDOR NAME | PENDING QTY | INV QTY |
 *                              DUE DATE | BANDEL | ADDRESS & GST NUMBER VERIFICATION | EWAY BILL VERIFICATION |
 *                              LR BILL VERIFIED | Invoice number | invoice date | EWAY BILL VERIFICATION IMAGE |
 *                              CHANGE BRAND | BRAND | SALES ORDER ID | ITEM NAME | PENDING QTY | REC QTY |
 *                              CANCEL QTY | PO RATE | SIZE | UNIT | INVOICE RATE | INWARD BATCH NO |
 *                              GROSS WEIGHT | REMARKS | NEW UNIQUE NO | OUTWARD BATCH NO |
 *                              MATRIAL REC IMAGE MULTIPLE IMAGE | REC QTY | PEND QTY | STATUS | LOGIN NAME
 *
 * Deploy: Deploy > New deployment > type "Web app" > Execute as "Me" > Who has access "Anyone" > Deploy.
 */

/* ---- Sheet name constants ---- */
var SHEETS = {
  login:      'LOGIN PAGE',
  matRecResp: 'MATERIAL REC RESPONSES',
  poReceived: 'PO RECIEVED'
};

// Alternate names to try if primary name not found
var SHEETS_ALT = {
  poReceived: ['PO RECEIVED', 'PO RECIEVED', 'Po Recieved', 'Po Received']
};

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Material Receiving')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function sheetToObjects_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  // Try alternate names if not found
  if (!sh) {
    var allSheets = ss.getSheets().map(function(s){return s.getName();});
    // Try case-insensitive match
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
  // Make headers unique: if duplicate, append _2, _3, etc.
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

function fmtTimestamp_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd-MMM-yyyy HH:mm:ss');
  return (v === undefined || v === null) ? '' : v;
}
function fmtDateOnly_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
  return (v === undefined || v === null) ? '' : v;
}
function fmtValue_(v) { return (v === undefined || v === null) ? '' : v; }
function isYes_(v) { return String(v || '').trim().toUpperCase() === 'YES'; }

function pick_(r, names) {
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

function mapUser_(r) {
  return {
    name: r['NAME'] || '', id: String(r['ID'] || '').trim(), password: String(r['PASSWORD'] || '').trim(),
    matRecView: isYes_(pick_(r, ['MATERIAL RECEIVED VIEW ENTRY'])),
    matRecAdd:  isYes_(pick_(r, ['MATERIAL ENTRY ADD'])),
    poReceived: isYes_(pick_(r, ['PO RECEIVED', 'PO RECIEVED']))
  };
}

function mapMatRec_(rows) {
  return rows.map(function (r) {
    return {
      timestamp: fmtTimestamp_(r['TIMESTAMP']),
      poNo: fmtValue_(r['PO NO']),
      invoiceUpload: fmtValue_(r['INVOICE UPLOAD']),
      vendorName: fmtValue_(r['VENDOR NAME']),
      pendingQtyTop: fmtValue_(r['PENDING QTY']),
      invQty: fmtValue_(r['INV QTY']),
      dueDate: fmtDateOnly_(r['DUE DATE']),
      bandel: fmtValue_(r['BANDEL']),
      addressGst: fmtValue_(r['ADDRESS & GST NUMBER VERIFICATION']),
      ewayBill: fmtValue_(r['EWAY BILL VERIFICATION']),
      lrBillVerified: fmtValue_(r['LR BILL VERIFIED']),
      invoiceNumber: fmtValue_(r['Invoice number']),
      invoiceDate: fmtDateOnly_(r['invoice date']),
      ewayBillImage: fmtValue_(r['EWAY BILL VERIFICATION IMAGE']),
      changeBrand: fmtValue_(r['CHANGE BRAND']),
      brand: fmtValue_(r['BRAND']),
      salesOrderId: fmtValue_(r['SALES ORDER ID']),
      itemName: fmtValue_(r['ITEM NAME']),
      pendingQty: fmtValue_(r['PENDING QTY']),
      recQty: fmtValue_(r['REC QTY']),
      cancelQty: fmtValue_(r['CANCEL QTY']),
      poRate: fmtValue_(r['PO RATE']),
      size: fmtValue_(r['SIZE']),
      unit: fmtValue_(r['UNIT']),
      invoiceRate: fmtValue_(r['INVOICE RATE']),
      inwardBatchNo: fmtValue_(r['INWARD BATCH NO']),
      grossWeight: fmtValue_(r['GROSS WEIGHT']),
      remarks: fmtValue_(r['REMARKS']),
      newUniqueNo: fmtValue_(r['NEW UNIQUE NO']),
      outwardBatchNo: fmtValue_(r['OUTWARD BATCH NO']),
      matRecImage: fmtValue_(r['MATRIAL REC IMAGE MULTIPLE IMAGE']),
      status: fmtValue_(r['STATUS']),
      loginName: fmtValue_(r['LOGIN NAME'] || r['LOGIN ID'] || '')
    };
  });
}

function mapPoReceived_(rows) {
  // Simple pass-through: use exact header names from debug log
  // Headers: TIMESTAMP, SALES ORDER NO, Voucher No., Dated, Mode/Terms of Payment,
  //   Dispatched Through, Buyer Name, Buyer Number, Terms of Delivery, Invoice To,
  //   ADDRESS, GSTIN/UIN, State Name, Code, CIN, E-Mail, Consignee (Ship To), ...
  return rows.map(function (r) {
    var keys = Object.keys(r);
    // Build a simple object using position-based approach: just pass all key-values
    var obj = {};
    keys.forEach(function(k) {
      obj[k] = fmtValue_(r[k]);
    });
    // Also format date fields
    if (r['TIMESTAMP'] instanceof Date) obj['TIMESTAMP'] = fmtTimestamp_(r['TIMESTAMP']);
    if (r['Dated'] instanceof Date) obj['Dated'] = fmtDateOnly_(r['Dated']);
    if (r['Due on'] instanceof Date) obj['Due on'] = fmtDateOnly_(r['Due on']);
    if (r['Due Date'] instanceof Date) obj['Due Date'] = fmtDateOnly_(r['Due Date']);
    return obj;
  });
}

function getUserPermissions(id) {
  var usersRaw = sheetToObjects_(SHEETS.login);
  var match = usersRaw.find(function (r) { return String(r['ID'] || '').trim().toLowerCase() === String(id || '').trim().toLowerCase(); });
  if (!match) return null;
  var u = mapUser_(match);
  delete u.password;
  return u;
}

function getLoginData() {
  var usersRaw = sheetToObjects_(SHEETS.login);
  return { users: usersRaw.map(mapUser_) };
}

function getBootstrapData(perms) {
  var result = {
    matRecResp: [],
    poReceived: [],
    users: [],
    missingSheets: []
  };

  // Load each sheet independently - if one fails, others still work
  try { result.matRecResp = mapMatRec_(sheetToObjects_(SHEETS.matRecResp)); } catch(e) { result.missingSheets.push(SHEETS.matRecResp + ' (error: ' + e.message + ')'); }
  try { result.poReceived = mapPoReceived_(sheetToObjects_(SHEETS.poReceived)); } catch(e) { result.missingSheets.push(SHEETS.poReceived + ' (error: ' + e.message + ')'); }
  try { result.users = sheetToObjects_(SHEETS.login).map(mapUser_); } catch(e) { result.missingSheets.push(SHEETS.login + ' (error: ' + e.message + ')'); }

  return result;
}

/**
 * Save Material Received entries.
 * payload = { topFields:{...}, rows:[{...},...], loginId, loginName }
 */
function saveMatRecEntries(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (!payload) return { status: 'error', message: 'No data received.' };

    var perms = getUserPermissions(payload.loginId || '');
    if (!perms || !perms.matRecAdd) return { status: 'error', message: 'You do not have permission to add Material Received entries.' };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEETS.matRecResp);
    if (!sh) return { status: 'error', message: 'Sheet not found: ' + SHEETS.matRecResp };

    var top = payload.topFields || {};
    var rows = payload.rows || [];
    if (!rows.length) return { status: 'error', message: 'No item rows to save.' };

    var now = new Date();
    var ts = fmtTimestamp_(now);
    var loginName = payload.loginName || '';

    var dataRows = rows.map(function (r) {
      return [
        ts,
        top.poNo || '',
        top.invoiceUpload || '',
        top.vendorName || '',
        top.pendingQtyTop || '',
        top.invQty || '',
        top.dueDate || '',
        top.bandel || '',
        top.addressGst || '',
        top.ewayBill || '',
        top.lrBillVerified || '',
        top.invoiceNumber || '',
        top.invoiceDate || '',
        top.ewayBillImage || '',
        r.changeBrand || '',
        r.brand || '',
        r.salesOrderId || '',
        r.itemName || '',
        r.pendingQty || '',
        r.recQty || '',
        r.cancelQty || '',
        r.poRate || '',
        r.size || '',
        r.unit || '',
        r.invoiceRate || '',
        r.inwardBatchNo || '',
        r.grossWeight || '',
        r.remarks || '',
        r.newUniqueNo || '',
        r.outwardBatchNo || '',
        r.matRecImage || '',
        loginName
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



/**
 * DEBUG FUNCTION — Run this from Apps Script editor to see exact headers.
 * Go to Apps Script > Run > debugPoHeaders > Check Logs (Ctrl+Enter)
 */
function debugPoHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('PO RECIEVED');
  if (!sh) {
    // Try alternate spellings
    sh = ss.getSheetByName('PO RECEIVED');
    if (!sh) {
      Logger.log('ERROR: Sheet not found! Tried: PO RECIEVED, PO RECEIVED');
      Logger.log('Available sheets: ' + ss.getSheets().map(function(s){return s.getName();}).join(', '));
      return;
    }
    Logger.log('NOTE: Found sheet as "PO RECEIVED" (different spelling)');
  }
  var data = sh.getDataRange().getValues();
  Logger.log('Total rows: ' + data.length);
  Logger.log('Headers (Row 1): ' + JSON.stringify(data[0].map(function(h,i){return 'Col'+(i+1)+': ['+String(h).replace(/\s+/g,' ').trim()+']';})));
  if (data.length > 1) {
    Logger.log('First data row (Row 2): ' + JSON.stringify(data[1].map(function(v,i){return 'Col'+(i+1)+': ['+String(v).substring(0,30)+']';})));
  }
}
