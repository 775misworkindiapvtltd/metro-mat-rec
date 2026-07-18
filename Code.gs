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
var SPREADSHEET_ID_AI = '12a2i4ZtPRu_A6KpBNKPA--B3QkEal3CQgn9LTH2Lv1A';

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
// Tries getActiveSpreadsheet first (works if bound), then openById (works if standalone).
function getSSAI() {
  // 1) Try active spreadsheet (works when script is bound to the sheet)
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  // 2) Fall back to openById (works for standalone scripts)
  if (SPREADSHEET_ID_AI && SPREADSHEET_ID_AI.length > 20) {
    return SpreadsheetApp.openById(SPREADSHEET_ID_AI); // let error surface if ID wrong
  }
  throw new Error('No spreadsheet found. Paste your Sheet ID into SPREADSHEET_ID_AI at top of Code.gs');
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
function fmtValueAI(v) {
  if (v === undefined || v === null) return '';
  // Convert Date objects to string (Date objects can break google.script.run serialization -> NULL)
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
  // Any other object -> string (safety net for serialization)
  if (typeof v === 'object') return String(v);
  return v;
}
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
  // Use CLEAN camelCase keys (no special chars like / : % ( ) which break
  // google.script.run serialization and cause NULL return to the client).
  return rows.map(function (r) {
    return {
      timestamp: fmtTimestampAI(pickAI(r, ['TIMESTAMP'])),
      salesOrderNo: fmtValueAI(pickAI(r, ['SALES ORDER NO', 'SALES ORDER'])),
      voucherNo: fmtValueAI(pickAI(r, ['Voucher No.', 'VOUCHER NO'])),
      dated: fmtDateOnlyAI(pickAI(r, ['Dated', 'DATED'])),
      modeTerms: fmtValueAI(pickAI(r, ['Mode/Terms of Payment', 'MODE/TERMS OF PAYMENT'])),
      dispatchedThrough: fmtValueAI(pickAI(r, ['Dispatched Through', 'DISPATCHED THROUGH'])),
      buyerName: fmtValueAI(pickAI(r, ['Buyer Name', 'BUYER NAME'])),
      buyerNumber: fmtValueAI(pickAI(r, ['Buyer Number', 'BUYER NUMBER'])),
      termsOfDelivery: fmtValueAI(pickAI(r, ['Terms of Delivery', 'TERMS OF DELIVERY'])),
      invoiceTo: fmtValueAI(pickAI(r, ['Invoice To', 'INVOICE TO'])),
      address: fmtValueAI(pickAI(r, ['ADDRESS'])),
      gstin: fmtValueAI(pickAI(r, ['GSTIN/UIN :', 'GSTIN/UIN'])),
      stateName: fmtValueAI(pickAI(r, ['State Name :', 'State Name'])),
      code: fmtValueAI(pickAI(r, ['Code'])),
      cin: fmtValueAI(pickAI(r, ['CIN :', 'CIN'])),
      email: fmtValueAI(pickAI(r, ['E-Mail :', 'E-Mail'])),
      consignee: fmtValueAI(pickAI(r, ['Consignee (Ship To)', 'Consignee'])),
      addressConsignee: fmtValueAI(pickAI(r, ['ADDRESS_2'])),
      supplier: fmtValueAI(pickAI(r, ['Supplier'])),
      addressSupplier: fmtValueAI(pickAI(r, ['ADDRESS_3'])),
      contactPerson: fmtValueAI(pickAI(r, ['CONTACT PERSON'])),
      phNo: fmtValueAI(pickAI(r, ['PH NO'])),
      supplierEmail: fmtValueAI(pickAI(r, ['EMAIL'])),
      uniqueNoAdd: fmtValueAI(pickAI(r, ['UNIQUE NO ADD'])),
      description: fmtValueAI(pickAI(r, ['Description of Goods', 'DESCRIPTION OF GOODS'])),
      size: fmtValueAI(pickAI(r, ['SIZE'])),
      brand: fmtValueAI(pickAI(r, ['BRAND'])),
      dueOn: fmtDateOnlyAI(pickAI(r, ['Due on', 'DUE ON'])),
      quantity: fmtValueAI(pickAI(r, ['Quantity(kgs)', 'QUANTITY(KGS)', 'Quantity'])),
      rate: fmtValueAI(pickAI(r, ['Rate', 'RATE'])),
      per: fmtValueAI(pickAI(r, ['Per', 'PER'])),
      disc: fmtValueAI(pickAI(r, ['Disc. %', 'DISC. %', 'Disc.%'])),
      amount: fmtValueAI(pickAI(r, ['Amount', 'AMOUNT'])),
      total: fmtValueAI(pickAI(r, ['TOTAL', 'Total'])),
      gst: fmtValueAI(pickAI(r, ['GST'])),
      grandTotal: fmtValueAI(pickAI(r, ['GRAND TOTAL', 'Grand Total'])),
      status: fmtValueAI(pickAI(r, ['STATUS', 'Status'])),
      extra: fmtValueAI(pickAI(r, ['EXTRA', 'Extra'])),
      deliveryAt: fmtValueAI(pickAI(r, ['DELIVERY AT', 'Delivery At'])),
      additionalRemark: fmtValueAI(pickAI(r, ['ADDITIONAL REMARK', 'Additional Remark'])),
      testCertType: fmtValueAI(pickAI(r, ['TEST CERTIFICATE TYPE ( MULTI SELECT)', 'TEST CERTIFICATE TYPE (MULTI SELECT)', 'TEST CERTIFICATE TYPE'])),
      toNoOfBundle: fmtValueAI(pickAI(r, ['TO NO. OF BUNDLE', 'TO NO OF BUNDLE'])),
      pdf: fmtValueAI(pickAI(r, ['PDF'])),
      dueDate: fmtDateOnlyAI(pickAI(r, ['Due Date', 'DUE DATE']))
    };
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
    missingSheets: [],
    debugInfo: []
  };

  // Load ALL data always (no permission gating on data fetch).
  // Permission only controls sidebar visibility on the frontend.
  try {
    var matRows = sheetToObjectsAI(SHEETS_AI.matRecResp);
    result.matRecResp = mapMatRecAI(matRows);
    result.debugInfo.push('MATERIAL REC RESPONSES: ' + matRows.length + ' rows');
  } catch(e) { result.missingSheets.push(SHEETS_AI.matRecResp + ' ERR: ' + e.message); }

  try {
    var poRows = sheetToObjectsAI(SHEETS_AI.poReceived);
    result.poReceived = mapPoReceivedAI(poRows);
    result.debugInfo.push('PO RECIEVED: ' + poRows.length + ' rows');
  } catch(e) { result.missingSheets.push(SHEETS_AI.poReceived + ' ERR: ' + e.message); }

  try {
    result.users = sheetToObjectsAI(SHEETS_AI.login).map(mapUserAI);
  } catch(e) { result.missingSheets.push(SHEETS_AI.login + ' ERR: ' + e.message); }

  // FINAL SAFETY NET: JSON round-trip strips any non-serializable values
  // (Date objects, undefined, etc.) that would make google.script.run return NULL.
  try {
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return { matRecResp: [], poReceived: [], users: [], missingSheets: ['SERIALIZE ERR: ' + e.message], debugInfo: [] };
  }
}

// SIMPLE TEST — run from Apps Script editor to verify data reads work.
// Returns a plain string (always serializable).
function testPoAI() {
  var poRows = sheetToObjectsAI(SHEETS_AI.poReceived);
  var matRows = sheetToObjectsAI(SHEETS_AI.matRecResp);
  var mapped = mapPoReceivedAI(poRows);
  var out = 'PO RECIEVED raw rows: ' + poRows.length +
            ' | MATERIAL REC RESPONSES raw rows: ' + matRows.length +
            ' | PO mapped rows: ' + mapped.length;
  Logger.log(out);
  if (mapped.length) Logger.log('First PO row: ' + JSON.stringify(mapped[0]));
  return out;
}

// TEST getBootstrapDataAI exactly as frontend calls it.
// Run this from editor - if it succeeds, web app should too.
function testBootstrapAI() {
  var perms = {matRecView: true, matRecAdd: true, poReceived: true};
  var result = getBootstrapDataAI(perms);
  Logger.log('Result type: ' + typeof result);
  Logger.log('matRecResp rows: ' + (result.matRecResp ? result.matRecResp.length : 'NULL'));
  Logger.log('poReceived rows: ' + (result.poReceived ? result.poReceived.length : 'NULL'));
  Logger.log('users: ' + (result.users ? result.users.length : 'NULL'));
  Logger.log('missingSheets: ' + JSON.stringify(result.missingSheets));
  Logger.log('debugInfo: ' + JSON.stringify(result.debugInfo));
  // Test JSON serialization (same as what google.script.run does)
  var jsonStr = JSON.stringify(result);
  Logger.log('JSON size: ' + jsonStr.length + ' bytes');
  if (jsonStr.length > 50000) Logger.log('WARNING: Large payload - might timeout on slow connections');
  return 'OK: ' + result.poReceived.length + ' PO rows, ' + result.matRecResp.length + ' mat rows, JSON size: ' + jsonStr.length;
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
