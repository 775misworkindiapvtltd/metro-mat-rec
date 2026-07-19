# METRO MAT REC - Key Points & Requirements

## 📋 PROJECT OVERVIEW
- **App:** Google Apps Script Web App (Material Receiving System)
- **Repo:** 775misworkindiapvtltd/metro-mat-rec (branch: latest-code)
- **Delivery:** User copies Code.gs + Index.html from GitHub Raw to Apps Script
- **Sheet ID:** 12a2i4ZtPRu_A6KpBNKPA--B3QkEal3CQgn9LTH2Lv1A

---

## 🔐 SECURITY
- **Passwords NEVER sent to client** — server-side login validation only
- `validateLoginAI()` checks credentials server-side
- Client state has NO password field
- No sensitive/calculated/prefilled fields exposed in console

---

## 👤 LOGIN & PERMISSIONS
- **LOGIN PAGE sheet** columns: NAME, ID, PASSWORD, PO RECIEVED, MATERRIAL RECEIVED VIEW ENTRY, MATERIAL ENTRY ADD
- **Col F (MATERIAL ENTRY ADD):**
  - `YES` → Only Add button visible
  - `YES & EDIT` → Add + Edit buttons visible
- **Login flow:** Button press → Green "Login Successful ✓" toast on LOGIN PAGE → 800ms delay → Navigate to data page (toast clears before navigation)
- **Enter key** triggers login (form submit)
- Sheet header has typo: `MATERRIAL RECEIVED VIEW ENTRY` (double R) — handled in code

---

## 📊 DATA TABLES (Material Received & PO Received)
- **S.No column:** Compact 38px width
- **Column resize:** Drag border to resize, widths persist to server per user
- **Column drag reorder:** Drag headers to reorder, order persists to server
- **Column hide/show:** Columns menu with checkboxes
- **Sort:** Click header to sort (asc/desc)
- **Filter:** Click search icon, type to filter
- **Date filter:** Calendar popup with presets (Today, Last 7 days, etc.)
- **Global search:** Searches all columns
- **Pagination:** 50/100/500/1000 rows per page
- **Table header text wraps** when column resized smaller (doesn't clip/hide)
- **A-/A/A+:** Zooms ONLY data area (not header/sidebar/pagination)
- **Dark mode:** Toggle button in topbar
- **Auto-refresh:** Every 10 minutes (silent)
- **Scroll position preserved** on sort/filter/render
- **HTTP URLs → "Click Here"** links (multiple URLs = multiple Click Here)
- **CANCEL status rows hidden** from Material Received table (filtered at SERVER level)

---

## 📝 MATERIAL REC ADD FORM

### Layout
- **Sidebar:** Icon-only (collapsed), click to expand (shows full names)
- **Breadcrumb:** ← Back to List / Material Received — New Entry
- **4 Card sections:** Purchase Details, Transport & Verification, Compliance, Quantity Summary
- **Item rows table** below cards (hidden until PO selected)

### Field Order & Logic
1. **Vendor Name** — Typeable dropdown (from PO Received data) — ONLY list selection allowed (no custom values)
2. **PO Number** — Typeable dropdown filtered by vendor — ONLY list selection
3. **PO first → Vendor auto-fills** from PO data
4. **Vendor change → CLEARS EVERYTHING** (all fields, rows, uploads)
5. **Invoice No, Invoice Date, Due Date, Bundle** — Manual inputs
6. **Invoice Upload** — Drag & drop / click, saves to Google Drive (DROPDOWN C2 folder ID)
7. **LR Image** — Drag & drop / click, saves to Drive
8. **LR Verified** — Dropdown (Yes/No/Pending)
9. **E-Way Verification** — Dropdown (Yes / Not Applicable)
10. **E-Way Image** — Text field only (no upload)
11. **Address & GST Verification** — Dropdown (Verified/Not Verified/Pending)
12. **Invoice Quantity** — Manual input
13. **Pending Quantity (top)** — AUTO = sum of all table row Pending QTY (readonly)

### Item Rows Table Columns
| Column | Source | Editable |
|--------|--------|----------|
| Change Brand | DROPDOWN sheet col A | Dropdown |
| Brand | PO data | Readonly |
| Sales Order ID | PO data | Readonly |
| Item Name | PO data | Readonly |
| PO QTY | PO data (quantity) | Readonly |
| Pending QTY | Auto-calc | Readonly |
| Already REC | Mat Rec Responses (ACTIVE only) | Readonly |
| REC QTY | Manual | Editable |
| Cancel QTY | Manual | Editable |
| PO Rate | PO data | Readonly |
| Size | PO data | Readonly |
| Unit | PO data | Readonly |
| Invoice Rate | Manual | Editable |
| Inward Batch No | Manual | Editable |
| Gross Weight | Manual | Editable |
| Remarks | Manual (TEXTAREA, resizable) | Editable |
| New Unique No | PO data (uniqueNoAdd) | Readonly |
| Outward Batch No | Auto (server-side, only when recQty>0) | Readonly |
| Mat Rec Image | Upload (per row, non-mandatory) | Upload |

### Calculations
- **Pending QTY (row)** = PO QTY - REC QTY - Cancel QTY - Already Received
- **Already Received** = sum of recQty from MATERIAL REC RESPONSES where SAME PO + SAME Vendor + SAME Item AND **STATUS = ACTIVE ONLY**
- **Outward Batch No:** Server-side auto-increment, only assigned when REC QTY > 0
  - Clear recQty → batch no clears
  - Re-entering → re-numbers ALL rows sequentially (no gaps)
  - Server reads max from col AD and increments

### Validation
- Only rows with REC QTY > 0 or Cancel QTY > 0 get saved
- Mandatory fields for saved rows: Invoice Rate, Inward Batch No, Gross Weight, Remarks
- Missing mandatory → Red border highlight + toast error
- **Submit disabled** while file uploads in progress (shows "⏳ Uploading (X)")

### Image Upload
- **All uploads go to Google Drive** (folder ID from DROPDOWN sheet C2)
- Upload starts **immediately** on file select (doesn't wait for submit)
- Multiple files supported (PDF, image, Word)
- After upload: numbered links (1, 2, 3) → click opens Drive file
- **Delete button (✕)** next to each uploaded file (removes from local only, not Drive)
- URLs saved as **plain comma-separated** (no {url=...} format)

---

## ✏️ EDIT MATERIAL REC
- **Edit button** visible when permission = "YES & EDIT"
- Same form as Add, with extra **MAT REC NO dropdown** at top
- Dropdown shows only numbers that have ACTIVE rows
- Select number → loads existing ACTIVE data (server-side `getMatRecForEditAI`)
- **Vendor Name & PO Number = READONLY** (cannot change in edit)
- **Batch No & New Unique No remain SAME** from original
- On Save: old rows → STATUS = "CANCEL", new rows → STATUS = "ACTIVE"
- **SAME MAT-REC number** kept (not new) — `editMatRecNo` passed to server

---

## 📄 PDF GENERATION
- **3 PDF buttons:** PDF (Punched), PDF (Pending), PDF (Overall)
- **Auto-generated on submit** (all 3, runs in background)
- **Manual click:** Opens popup preview + saves to Drive (only if data already saved)
- PDF saved to Google Drive folder (DROPDOWN C2)
- PDF links saved in sheet:
  - Col AF (32) = REC QTY PDF LINK (punched)
  - Col AG (33) = PEND QTY PDF LINK (pending)
  - Col AJ (36) = OVERALL PDF LINK
- **No false "PDF saved" toast** before submit

---

## 💾 SHEET COLUMN LAYOUT (37 columns saved)
| Col | Letter | Field |
|-----|--------|-------|
| 1 | A | TIMESTAMP |
| 2 | B | PO NO |
| 3 | C | INVOICE UPLOAD (URLs) |
| 4 | D | VENDOR NAME |
| 5 | E | PENDING QTY |
| 6 | F | INV QTY |
| 7 | G | DUE DATE |
| 8 | H | BANDEL |
| 9 | I | ADDRESS & GST |
| 10 | J | EWAY BILL |
| 11 | K | LR BILL VERIFIED |
| 12 | L | INVOICE NUMBER |
| 13 | M | INVOICE DATE |
| 14 | N | EWAY BILL IMAGE |
| 15 | O | CHANGE BRAND |
| 16 | P | BRAND |
| 17 | Q | SALES ORDER ID |
| 18 | R | ITEM NAME |
| 19 | S | PENDING QTY |
| 20 | T | REC QTY |
| 21 | U | CANCEL QTY |
| 22 | V | PO RATE |
| 23 | W | SIZE |
| 24 | X | UNIT |
| 25 | Y | INVOICE RATE |
| 26 | Z | INWARD BATCH NO |
| 27 | AA | GROSS WEIGHT |
| 28 | AB | REMARKS |
| 29 | AC | NEW UNIQUE NO |
| 30 | AD | OUTWARD BATCH NO |
| 31 | AE | MATRIAL REC IMAGE (URLs) |
| 32 | AF | REC QTY PDF LINK |
| 33 | AG | PEND QTY PDF LINK |
| 34 | AH | STATUS (ACTIVE) |
| 35 | AI | MAT-REC-XXXXX (unique no) |
| 36 | AJ | OVERALL PDF LINK |
| 37 | AK | LOGIN NAME |

---

## 🔢 MAT-REC UNIQUE NUMBER
- Format: `MAT-REC-00001`, `MAT-REC-00002`, etc. (5-digit padded)
- Auto-incremental from col AI (35)
- **SAME number for ALL rows** in one batch save
- In Edit mode: keeps SAME number (doesn't generate new)

---

## 🔧 DROPDOWN SHEET SETUP
| Cell | Content |
|------|---------|
| A column | Brand dropdown values |
| C2 | Google Drive Folder ID (for uploads & PDFs) |

---

## ⚡ PERFORMANCE
- Save Entry: Single server call (no pre-fetch)
- Outward Batch calculated server-side
- Server filters ACTIVE-only data before sending to client
- Image uploads start immediately (don't wait for submit)
- Auto-refresh every 10 minutes (silent, no spinner)
- Column widths persist to server (no re-adjustment needed)

---

## 🎨 UI/UX
- **Sidebar:** Icon-only collapsed, full names on expand, labels below icons always visible (short: "Mat Rec", "PO Rec")
- **Topbar:** A-/A/A+ (zooms data only), dark/light toggle, clock, welcome message
- **Toast notifications:** Green success, Red error, auto-dismiss 3 seconds
- **Reset button:** Custom styled popup (not browser confirm) — "Are you sure?" with Yes/No
- **Dropdown:** Position fixed, z-index 9999, only one open at a time, strict list-only (blur clears invalid values)
- **Readonly fields:** Gray background (cell-ro class)
- **Tooltip on hover:** All readonly cells show full value via title attribute

---

## 📋 IMPORTANT RULES
- Always push code to GitHub (never paste large code in chat)
- Test before saying complete (parse check + functional test)
- DROPDOWN sheet C2 = Drive folder ID (must be set by user)
- Sheet AI1 header = "MAT REC NO" (for edit dropdown to work)
- User communicates in Hindi/Hinglish
- Implement directly and push — don't ask for confirmation



---

## 🚫 NEGATIVE NUMBERS BLOCKED
- All numeric fields in Material Rec form have `min="0"` (HTML validation)
- Fields: Invoice Quantity, REC QTY, Cancel QTY, Invoice Rate, Gross Weight
- Save-time validation: rejects negative values (clears to empty + error)
- No negative data can be entered or saved in any number field
