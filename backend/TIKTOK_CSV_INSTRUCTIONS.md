# TikTok Shop Bulk Update - CSV Instructions

## Overview

Use the CSV bulk update to update product prices and stock across your TikTok Shop listings in one upload. The Admin Panel processes the file row-by-row and streams live progress back to the browser.

After a successful sync, the system writes the TikTok productId and skuId back to the matching inventory item in the database using sellerSku as the lookup key.

Failed rows can be downloaded as an **XLSX file**  long IDs are preserved as text and card names with special characters or commas are handled correctly.

---

## CSV Columns

| Column | Required | Description |
|---|---|---|
| productId | Yes | TikTok product ID (18+ digit number) |
| skuId | Yes | TikTok SKU ID (18+ digit number) |
| sellerSku | No | Your internal SKU  used to match the inventory slot in the database and write back the TikTok IDs after sync |
| productName | No | Human-readable label, shown in progress/result output |
| price | No | Price in smallest currency unit (IDR = rupiah, e.g. 15000 = Rp 15.000) |
| stock | No | Stock quantity to set |

At least one of price or stock must be provided per row, otherwise the row has nothing to update.

---

## Preventing Scientific Notation in Excel

TikTok product IDs and SKU IDs are 18-19 digit numbers. Excel and Google Sheets will convert them to scientific notation (e.g. 1.73E+18) unless you force them to be treated as text. This breaks the upload.

### Solution 1: Use the Apostrophe Prefix (Recommended)

Add a single quote ' before each productId and skuId value:

`csv
productId,skuId,sellerSku,productName,price,stock
'1734282158070260000,'1734282158070335348,MTG-BLB-001-NM-NF,Bloomburrow Card,15000,10
`

The apostrophe tells Excel to store the cell as text. The upload backend strips it automatically before sending to TikTok.

### Solution 2: Format Columns as Text First

1. Open a blank Excel file
2. Select columns A and B
3. Right-click -> Format Cells -> Text
4. Paste your IDs into those columns

### Solution 3: Use a Text Editor

Edit the CSV in Notepad, VS Code, or any plain-text editor. No automatic format conversion will happen.

---

## Template File

Use 	iktok-bulk-update-template.csv as your starting point. It already includes:
- The correct column names and order
- Apostrophe-prefixed example IDs
- Example sellerSku values

---

## Example CSV

`csv
productId,skuId,sellerSku,productName,price,stock
'1734282158070260000,'1734282158070335348,MTG-BLB-001-NM-NF,Bloomburrow NF,15000,10
'1734282158070260000,'1734282158070335349,MTG-BLB-001-NM-F,Bloomburrow Foil,18000,5
'1734282148160700000,'1734282148160767860,MTG-DFT-001-NM-NF,Other Card,25000,8
`

---

## Upload Steps

1. Go to **Admin Panel -> TikTok Shop Debug**
2. Enter your TikTok App Key, App Secret, and Access Token (and Shop Cipher if needed)
3. Click **Choose File** and select your CSV
4. Click **Upload and Update**
5. Watch the live progress bar  each product is processed and shown as success or failure
6. If any rows failed, download the **XLSX** file, fix the issues, and re-upload

---

## How sellerSku Links to the Database

When you set up a card's inventory slot in the system, you assign a sellerSku value (e.g. MTG-BLB-001-NM-NF). This same value goes in the sellerSku column of your CSV.

After the TikTok price/stock update succeeds, the system looks up the inventory slot where inventory.sellerSku matches the CSV value and saves:
- inventory.$.tiktokProductId = the productId from the CSV
- inventory.$.tiktokSkuId = the skuId from the CSV

This makes future TikTok order matching automatic.

---

## Failed Rows XLSX Download

The downloaded XLSX file contains the same columns as the upload CSV plus an error column with the TikTok API error message.

Important: productId and skuId are stored as **text** in the XLSX so they never display as scientific notation  you can edit and re-upload without needing to reformat.