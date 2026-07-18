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
  // Robust mapper: tries multiple possible header name variations
  // Also reads raw keys to find the data regardless of exact spelling
  return rows.map(function (r) {
    var keys = Object.keys(r);
    // Helper: find value by trying multiple possible header names (case-insensitive partial match)
    function findVal(searches) {
      for (var i = 0; i < searches.length; i++) {
        var s = searches[i].toUpperCase();
        // Exact match first
        if (r[searches[i]] !== undefined && r[searches[i]] !== '') return r[searches[i]];
        // Case-insensitive match
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].toUpperCase().replace(/\s+/g,' ').trim() === s) return r[keys[j]];
        }
        // Partial/contains match
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].toUpperCase().replace(/\s+/g,' ').trim().indexOf(s) !== -1) return r[keys[j]];
        }
      }
      return '';
    }
    return {
      timestamp: fmtTimestamp_(findVal(['TIMESTAMP'])),
      salesOrderNo: fmtValue_(findVal(['SALES ORDER NO', 'SALES ORDER'])),
      voucherNo: fmtValue_(findVal(['Voucher No.', 'VOUCHER NO', 'Voucher No'])),
      dated: fmtDateOnly_(findVal(['Dated', 'DATED'])),
      modeTerms: fmtValue_(findVal(['Mode/Terms of Payment', 'MODE/TERMS OF PAYMENT', 'Mode/Terms'])),
      dispatchedThrough: fmtValue_(findVal(['Dispatched Through', 'DISPATCHED THROUGH'])),
      buyerName: fmtValue_(findVal(['Buyer Name', 'BUYER NAME'])),
      buyerNumber: fmtValue_(findVal(['Buyer Number', 'BUYER NUMBER'])),
      termsOfDelivery: fmtValue_(findVal(['Terms of Delivery', 'TERMS OF DELIVERY'])),
      invoiceTo: fmtValue_(findVal(['Invoice To', 'INVOICE TO'])),
      address: fmtValue_(findVal(['ADDRESS'])),
      gstin: fmtValue_(findVal(['GSTIN/UIN :', 'GSTIN/UIN', 'GSTIN'])),
      stateName: fmtValue_(findVal(['State Name :', 'State Name', 'STATE NAME'])),
      code: fmtValue_(findVal(['Code', 'CODE'])),
      cin: fmtValue_(findVal(['CIN :', 'CIN'])),
      email: fmtValue_(findVal(['E-Mail :', 'E-Mail', 'EMAIL', 'E-MAIL'])),
      consignee: fmtValue_(findVal(['Consignee (Ship To)', 'CONSIGNEE', 'Consignee'])),
      supplier: fmtValue_(findVal(['Supplier', 'SUPPLIER'])),
      contactPerson: fmtValue_(findVal(['CONTACT PERSON', 'Contact Person'])),
      phNo: fmtValue_(findVal(['PH NO', 'Ph No', 'PHONE'])),
      supplierEmail: fmtValue_(findVal(['EMAIL', 'E-Mail'])),
      uniqueNoAdd: fmtValue_(findVal(['UNIQUE NO ADD', 'Unique No Add', 'UNIQUE NO'])),
      description: fmtValue_(findVal(['Description of Goods', 'DESCRIPTION OF GOODS', 'Description'])),
      size: fmtValue_(findVal(['SIZE'])),
      brand: fmtValue_(findVal(['BRAND'])),
      dueOn: fmtDateOnly_(findVal(['Due on', 'DUE ON', 'Due On'])),
      quantity: fmtValue_(findVal(['Quantity(kgs)', 'QUANTITY(KGS)', 'Quantity', 'QUANTITY'])),
      rate: fmtValue_(findVal(['Rate', 'RATE'])),
      per: fmtValue_(findVal(['Per', 'PER'])),
      disc: fmtValue_(findVal(['Disc. %', 'DISC. %', 'Disc.%', 'DISC'])),
      amount: fmtValue_(findVal(['Amount', 'AMOUNT'])),
      total: fmtValue_(findVal(['TOTAL', 'Total'])),
      gst: fmtValue_(findVal(['GST'])),
      grandTotal: fmtValue_(findVal(['GRAND TOTAL', 'Grand Total'])),
      status: fmtValue_(findVal(['STATUS', 'Status'])),
      extra: fmtValue_(findVal(['EXTRA', 'Extra'])),
      deliveryAt: fmtValue_(findVal(['DELIVERY AT', 'Delivery At'])),
      additionalRemark: fmtValue_(findVal(['ADDITIONAL REMARK', 'Additional Remark'])),
      testCertType: fmtValue_(findVal(['TEST CERTIFICATE TYPE', 'Test Certificate Type'])),
      toNoOfBundle: fmtValue_(findVal(['TO NO. OF BUNDLE', 'To No. Of Bundle', 'TO NO'])),
      pdf: fmtValue_(findVal(['PDF'])),
      dueDate: fmtDateOnly_(findVal(['Due Date', 'DUE DATE']))
    };
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
  var loadAll = !perms;

  var result = {
    matRecResp: mapMatRec_(sheetToObjects_(SHEETS.matRecResp)),
    poReceived: mapPoReceived_(sheetToObjects_(SHEETS.poReceived)),
    users: sheetToObjects_(SHEETS.login).map(mapUser_),
    missingSheets: []
  };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var have = {};
  ss.getSheets().forEach(function (s) { have[s.getName().trim().toUpperCase()] = true; });
  Object.keys(SHEETS).forEach(function (k) {
    if (!have[SHEETS[k].toUpperCase()]) result.missingSheets.push(SHEETS[k]);
  });

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
