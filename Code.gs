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
    name: String(pickAI(r, ['NAME', 'Name', 'name']) || '').trim(),
    id: String(pickAI(r, ['ID', 'Id', 'id', 'USER ID', 'User ID', 'LOGIN ID']) || '').trim(),
    password: String(pickAI(r, ['PASSWORD', 'Password', 'password', 'PASS', 'Pass']) || '').trim(),
    matRecView: isYesAI(pickAI(r, ['MATERIAL RECEIVED VIEW ENTRY', 'MATERIAL RECEIVED VIEW', 'MATERRIAL RECEIVED VIEW ENTRY', 'MAT REC VIEW'])),
    matRecAdd:  isYesAI(pickAI(r, ['MATERIAL ENTRY ADD', 'MATERIAL ADD'])),
    matRecEdit: (function(){
      var val = String(pickAI(r, ['MATERIAL ENTRY ADD', 'MATERIAL ADD']) || '').trim().toUpperCase();
      return val === 'YES & EDIT' || val === 'YES AND EDIT';
    })(),
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
      matRecNo: fmtValueAI(pickAI(r, ['MAT REC NO', 'MAT-REC NO', 'MAT-REC-NO', 'MATRECNO'])),
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
  var inputId = String(id || '').trim().toLowerCase();
  var match = null;
  for (var i = 0; i < usersRaw.length; i++) {
    var u = mapUserAI(usersRaw[i]);
    if (u.id.toLowerCase() === inputId) { match = u; break; }
  }
  if (!match) return null;
  delete match.password;
  return match;
}

function getLoginDataAI() {
  // SECURITY: Never send passwords to client. Only send user IDs for display.
  // Login validation is done server-side via validateLoginAI()
  return { ready: true };
}

// SERVER-SIDE login validation — password never goes to client
function validateLoginAI(credentials) {
  if (!credentials || !credentials.id || credentials.password === undefined || credentials.password === null || credentials.password === '') {
    return { success: false, error: 'User ID and Password required.' };
  }
  var usersRaw = sheetToObjectsAI(SHEETS_AI.login);
  var inputId = String(credentials.id).trim().toLowerCase();
  var inputPw = String(credentials.password).trim();
  
  var matchedUser = null;
  for (var i = 0; i < usersRaw.length; i++) {
    var u = mapUserAI(usersRaw[i]);
    if (u.id.toLowerCase() === inputId && u.password === inputPw) {
      matchedUser = u;
      break;
    }
  }
  
  if (!matchedUser) {
    return { success: false, error: 'Invalid user ID or password.' };
  }
  delete matchedUser.password; // NEVER send password to client
  return { success: true, user: matchedUser };
}

function getBootstrapDataAI(perms) {
  var result = {
    matRecResp: [],
    poReceived: [],
    missingSheets: [],
    debugInfo: []
  };

  // Permission-based loading: only fetch sheets user actually needs (faster!)
  var needMat = !perms || perms.matRecView || perms.matRecAdd || perms.matRecEdit;
  var needPo = !perms || perms.poReceived;

  if (needMat) {
    try {
      var matRows = sheetToObjectsAI(SHEETS_AI.matRecResp);
      result.matRecResp = mapMatRecAI(matRows);
      result.debugInfo.push('MAT: ' + matRows.length);
    } catch(e) { result.missingSheets.push(SHEETS_AI.matRecResp + ' ERR: ' + e.message); }
  }

  if (needPo) {
    try {
      var poRows = sheetToObjectsAI(SHEETS_AI.poReceived);
      result.poReceived = mapPoReceivedAI(poRows);
      result.debugInfo.push('PO: ' + poRows.length);
    } catch(e) { result.missingSheets.push(SHEETS_AI.poReceived + ' ERR: ' + e.message); }
  }

  // FINAL SAFETY NET: JSON round-trip strips any non-serializable values
  try {
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return { matRecResp: [], poReceived: [], missingSheets: ['SERIALIZE ERR: ' + e.message], debugInfo: [] };
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

// TEST LOGIN — run from editor to verify login works
// Shows what headers are being read and what values are matched
function testLoginAI() {
  var usersRaw = sheetToObjectsAI(SHEETS_AI.login);
  Logger.log('LOGIN PAGE rows found: ' + usersRaw.length);
  if (usersRaw.length === 0) {
    Logger.log('ERROR: No rows in LOGIN PAGE sheet!');
    return;
  }
  Logger.log('First row keys: ' + JSON.stringify(Object.keys(usersRaw[0])));
  // Show first 3 users (ID only, no password in log)
  for (var i = 0; i < Math.min(3, usersRaw.length); i++) {
    var u = mapUserAI(usersRaw[i]);
    Logger.log('User ' + (i+1) + ': id=[' + u.id + '] name=[' + u.name + '] pw_length=' + u.password.length + ' matRecView=' + u.matRecView + ' matRecAdd=' + u.matRecAdd + ' poReceived=' + u.poReceived);
  }
  // Test actual validation
  var firstUser = mapUserAI(usersRaw[0]);
  var testResult = validateLoginAI({id: firstUser.id, password: firstUser.password});
  Logger.log('Test login result for "' + firstUser.id + '": ' + JSON.stringify(testResult));
  return 'Found ' + usersRaw.length + ' users. First user id: ' + firstUser.id + ', login test: ' + (testResult.success ? 'PASS' : 'FAIL: ' + testResult.error);
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

// ===== USER SETTINGS (column widths, per user, cross-browser) =====
// Uses PropertiesService.getUserProperties() — saves per Google account, works across all browsers/devices.
function saveUserSettingsAI(payload) {
  try {
    var key = 'colWidths_' + (payload.page || 'default');
    PropertiesService.getUserProperties().setProperty(key, JSON.stringify(payload.widths || {}));
    return { status: 'ok' };
  } catch (e) { return { status: 'error', message: e.message }; }
}

function loadUserSettingsAI(payload) {
  try {
    var key = 'colWidths_' + (payload.page || 'default');
    var raw = PropertiesService.getUserProperties().getProperty(key);
    return { status: 'ok', widths: raw ? JSON.parse(raw) : {} };
  } catch (e) { return { status: 'ok', widths: {} }; }
}

function saveMatRecEntriesAI(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (!payload) return { status: 'error', message: 'No data received.' };

    var perms = getUserPermissionsAI(payload.loginId || '');
    if (!perms || (!perms.matRecAdd && !perms.matRecEdit)) return { status: 'error', message: 'You do not have permission to add/edit Material Received entries.' };

    var ss = getSSAI();
    var sh = ss.getSheetByName(SHEETS_AI.matRecResp);
    if (!sh) return { status: 'error', message: 'Sheet not found: ' + SHEETS_AI.matRecResp };

    var top = payload.topFields || {};
    var rows = payload.rows || [];
    if (!rows.length) return { status: 'error', message: 'No item rows to save.' };

    var now = new Date();
    var ts = fmtTimestampAI(now);
    var loginName = payload.loginName || '';

    // Generate unique MAT-REC number (incremental, same for all items in this batch)
    var matRecNo = 'MAT-REC-00001';
    try {
      var lastRow = sh.getLastRow();
      if (lastRow > 1) {
        // Check col 35 (AI) for existing MAT-REC numbers
        var matRecCol = 35;
        var existingNos = sh.getRange(2, matRecCol, lastRow - 1, 1).getValues();
        var maxNum = 0;
        existingNos.forEach(function(row) {
          var val = String(row[0] || '');
          var m = val.match(/MAT-REC-(\d+)/);
          if (m) { var n = parseInt(m[1], 10); if (n > maxNum) maxNum = n; }
        });
        matRecNo = 'MAT-REC-' + String(maxNum + 1).padStart(5, '0');
      }
    } catch(e) { /* fallback to 00001 */ }

    // Calculate outward batch numbers server-side (for speed)
    var outwardBase = 1;
    try {
      var lastRow2 = sh.getLastRow();
      if (lastRow2 > 1) {
        var obCol = 30; // AD = outward batch no
        var obData = sh.getRange(2, obCol, lastRow2 - 1, 1).getValues();
        obData.forEach(function(row) {
          var val = String(row[0] || '');
          var m2 = val.match(/(\d+)$/);
          if (m2) { var n2 = parseInt(m2[1], 10); if (n2 >= outwardBase) outwardBase = n2 + 1; }
        });
      }
    } catch(e2) {}
    var obIdx = 0;

    var dataRows = rows.map(function (r) {
      // Assign outward batch number server-side
      // If row already has a valid outward batch (edit mode), keep it
      var outBatch = '';
      var existingOB = String(r.outwardBatchNo || '');
      if (existingOB && existingOB.indexOf('__AUTO__') !== 0) {
        outBatch = existingOB;
      } else if (parseFloat(r.recQty) > 0) {
        outBatch = String(outwardBase + obIdx);
        obIdx++;
      }
      // matRecImage: convert array of {url} to comma-separated plain URLs
      var imgUrls = '';
      if (Array.isArray(r.matRecImage)) {
        imgUrls = r.matRecImage.filter(function(f){return f&&f.url;}).map(function(f){return f.url;}).join(',');
      } else {
        imgUrls = String(r.matRecImage||'');
      }
      // invoiceUpload/lrImage: convert to comma-separated URLs  
      var invUploadUrls = '';
      if (Array.isArray(top.invoiceUpload)) {
        invUploadUrls = top.invoiceUpload.filter(function(f){return f&&f.url;}).map(function(f){return f.url;}).join(',');
      } else { invUploadUrls = String(top.invoiceUpload||''); }
      var lrImageUrls = '';
      if (Array.isArray(top.lrImage)) {
        lrImageUrls = top.lrImage.filter(function(f){return f&&f.url;}).map(function(f){return f.url;}).join(',');
      } else { lrImageUrls = String(top.lrImage||''); }
      
      return [
        ts, top.poNo||'', invUploadUrls, top.vendorName||'', top.pendingQtyTop||'',
        top.invQty||'', top.dueDate||'', top.bandel||'', top.addressGst||'', top.ewayBill||'',
        top.lrBillVerified||'', top.invoiceNumber||'', top.invoiceDate||'', top.ewayBillImage||'',
        r.changeBrand||'', r.brand||'', r.salesOrderId||'', r.itemName||'',
        r.pendingQty||'', r.recQty||'', r.cancelQty||'', r.poRate||'',
        r.size||'', r.unit||'', r.invoiceRate||'', r.inwardBatchNo||'',
        r.grossWeight||'', r.remarks||'', r.newUniqueNo||'', outBatch,
        imgUrls,
        '',          // Col 32 (AF) = REC QTY PDF LINK
        '',          // Col 33 (AG) = PEND QTY PDF LINK
        'ACTIVE',    // Col 34 (AH) = STATUS
        matRecNo,    // Col 35 (AI) = MAT-REC-XXXXX
        '',          // Col 36 (AJ) = OVERALL PDF LINK
        loginName    // Col 37 (AK) = LOGIN NAME
      ];
    });

    sh.getRange(sh.getLastRow() + 1, 1, dataRows.length, 37).setValues(dataRows);
    return { status: 'ok', saved: dataRows.length, matRecNo: matRecNo };
  } catch (err) {
    return { status: 'error', message: err.message };
  } finally {
    lock.releaseLock();
  }
}

function getDropdownDataAI() {
  var ss = getSSAI();
  var result = { brands: [] };
  // Try to read DROPDOWN sheet, column A for brands
  try {
    var sh = ss.getSheetByName('DROPDOWN');
    if (!sh) {
      var allSheets = ss.getSheets().map(function(s){return s.getName();});
      for (var i = 0; i < allSheets.length; i++) {
        if (allSheets[i].toUpperCase().replace(/\s+/g,'') === 'DROPDOWN') {
          sh = ss.getSheetByName(allSheets[i]); break;
        }
      }
    }
    if (sh) {
      var data = sh.getRange('A2:A').getValues();
      result.brands = data.filter(function(r){return r[0]!=='';}).map(function(r){return String(r[0]).trim();});
    }
  } catch(e) { result.brands = []; }
  return result;
}

// ===== FILE UPLOAD TO GOOGLE DRIVE =====
// Uploads a file (base64) to the folder specified in DROPDOWN C2
function uploadFileToDriveAI(payload) {
  try {
    if (!payload || !payload.data || !payload.fileName || !payload.mimeType) {
      return { status: 'error', message: 'Missing file data, fileName or mimeType' };
    }
    var ss = getSSAI();
    var folderId = '';
    try {
      var ddSh = ss.getSheetByName('DROPDOWN');
      if (!ddSh) {
        var allSheets = ss.getSheets().map(function(s){return s.getName();});
        for (var i = 0; i < allSheets.length; i++) {
          if (allSheets[i].toUpperCase().replace(/\s+/g,'') === 'DROPDOWN') {
            ddSh = ss.getSheetByName(allSheets[i]); break;
          }
        }
      }
      if (ddSh) folderId = String(ddSh.getRange('C2').getValue() || '').trim();
    } catch(e) {}
    if (!folderId) return { status: 'error', message: 'Folder ID not found in DROPDOWN C2' };
    
    var blob = Utilities.newBlob(Utilities.base64Decode(payload.data), payload.mimeType, payload.fileName);
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { status: 'ok', url: file.getUrl(), name: payload.fileName };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

function getMatRecForEditAI(matRecNo) {
  if (!matRecNo) return { status: 'error', message: 'No MAT-REC number provided' };
  var ss = getSSAI();
  var sh = ss.getSheetByName(SHEETS_AI.matRecResp);
  if (!sh) return { status: 'error', message: 'Sheet not found' };
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { status: 'error', message: 'No data' };
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var rowMatRec = String(data[i][34] || '').trim();
    var rowStatus = String(data[i][33] || '').trim().toUpperCase();
    var rowRecQty = String(data[i][19] || '').trim();
    if (rowMatRec === matRecNo && rowStatus === 'ACTIVE' && rowRecQty !== '') {
      rows.push({
        rowIndex: i + 1,
        timestamp: fmtValueAI(data[i][0]),
        poNo: fmtValueAI(data[i][1]),
        invoiceUpload: fmtValueAI(data[i][2]),
        vendorName: fmtValueAI(data[i][3]),
        invQty: fmtValueAI(data[i][5]),
        dueDate: fmtValueAI(data[i][6]),
        bandel: fmtValueAI(data[i][7]),
        addressGst: fmtValueAI(data[i][8]),
        ewayBill: fmtValueAI(data[i][9]),
        lrBillVerified: fmtValueAI(data[i][10]),
        invoiceNumber: fmtValueAI(data[i][11]),
        invoiceDate: fmtValueAI(data[i][12]),
        ewayBillImage: fmtValueAI(data[i][13]),
        changeBrand: fmtValueAI(data[i][14]),
        brand: fmtValueAI(data[i][15]),
        salesOrderId: fmtValueAI(data[i][16]),
        itemName: fmtValueAI(data[i][17]),
        pendingQty: fmtValueAI(data[i][18]),
        recQty: fmtValueAI(data[i][19]),
        cancelQty: fmtValueAI(data[i][20]),
        poRate: fmtValueAI(data[i][21]),
        size: fmtValueAI(data[i][22]),
        unit: fmtValueAI(data[i][23]),
        invoiceRate: fmtValueAI(data[i][24]),
        inwardBatchNo: fmtValueAI(data[i][25]),
        grossWeight: fmtValueAI(data[i][26]),
        remarks: fmtValueAI(data[i][27]),
        newUniqueNo: fmtValueAI(data[i][28]),
        outwardBatchNo: fmtValueAI(data[i][29]),
        matRecImage: fmtValueAI(data[i][30])
      });
    }
  }
  if (!rows.length) return { status: 'error', message: 'No ACTIVE rows found for ' + matRecNo };
  try {
    return JSON.parse(JSON.stringify({ status: 'ok', rows: rows }));
  } catch (e) {
    return { status: 'error', message: 'Serialize error: ' + e.message };
  }
}

function cancelMatRecRowsAI(matRecNo) {
  if (!matRecNo) return { status: 'error', message: 'No MAT-REC number' };
  var ss = getSSAI();
  var sh = ss.getSheetByName(SHEETS_AI.matRecResp);
  if (!sh) return { status: 'error', message: 'Sheet not found' };
  var data = sh.getDataRange().getValues();
  var statusCol = 34; // AH column (1-indexed)
  var count = 0;
  for (var i = 1; i < data.length; i++) {
    var rowMatRec = String(data[i][34] || '').trim();
    var rowStatus = String(data[i][33] || '').trim().toUpperCase();
    if (rowMatRec === matRecNo && rowStatus === 'ACTIVE') {
      sh.getRange(i + 1, statusCol).setValue('CANCEL');
      count++;
    }
  }
  return { status: 'ok', cancelled: count };
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

// ===== PDF SAVE TO GOOGLE DRIVE =====
// Reads folder ID from DROPDOWN sheet C2
// Generates PDF from HTML content, saves to folder, returns link
function savePdfToDriveAI(payload) {
  try {
    if (!payload || !payload.htmlContent || !payload.fileName) {
      return { status: 'error', message: 'Missing htmlContent or fileName' };
    }
    
    // Get folder ID from DROPDOWN sheet C2
    var ss = getSSAI();
    var folderId = '';
    try {
      var ddSh = ss.getSheetByName('DROPDOWN');
      if (!ddSh) {
        var allSheets = ss.getSheets().map(function(s){return s.getName();});
        for (var i = 0; i < allSheets.length; i++) {
          if (allSheets[i].toUpperCase().replace(/\s+/g,'') === 'DROPDOWN') {
            ddSh = ss.getSheetByName(allSheets[i]); break;
          }
        }
      }
      if (ddSh) {
        folderId = String(ddSh.getRange('C2').getValue() || '').trim();
      }
    } catch(e) {}
    
    if (!folderId) {
      return { status: 'error', message: 'Folder ID not found in DROPDOWN sheet C2. Please add folder ID.' };
    }
    
    // Create PDF blob from HTML
    var blob = Utilities.newBlob(payload.htmlContent, 'text/html', 'temp.html');
    var pdfBlob = blob.getAs('application/pdf').setName(payload.fileName + '.pdf');
    
    // Save to folder
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(pdfBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileUrl = file.getUrl();
    
    return { status: 'ok', url: fileUrl, fileId: file.getId() };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

// Save PDF link to MAT REC RESPONSES
// type='punched' → col 32 (AF), type='pending' → col 33 (AG), type='overall' → col 36 (AJ)
function savePdfLinkToSheetAI(payload) {
  try {
    if (!payload || !payload.pdfUrl) {
      return { status: 'error', message: 'Missing data' };
    }
    var ss = getSSAI();
    var sh = ss.getSheetByName(SHEETS_AI.matRecResp);
    if (!sh) return { status: 'error', message: 'Sheet not found' };
    
    var pdfCol = 32; // AF = REC QTY PDF (punched)
    if (payload.type === 'pending') pdfCol = 33; // AG
    if (payload.type === 'overall') pdfCol = 36; // AJ
    
    // Find rows with matching MAT-REC number and set PDF link
    var matRecNo = payload.matRecNo || '';
    if (matRecNo) {
      var lastRow = sh.getLastRow();
      if (lastRow > 1) {
        var aiCol = 35; // AI column has MAT-REC number
        var matRecNos = sh.getRange(2, aiCol, lastRow - 1, 1).getValues();
        for (var r = 0; r < matRecNos.length; r++) {
          if (String(matRecNos[r][0] || '').trim() === matRecNo) {
            sh.getRange(r + 2, pdfCol).setValue(payload.pdfUrl);
          }
        }
      }
    }
    
    return { status: 'ok' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
