# TikTok Shop Bulk Update - CSV Instructions

## CSV Format

The CSV file must contain the following columns:
- `productId` - TikTok product ID (required)
- `skuId` - TikTok SKU ID (required)
- `productName` - Product name for display (optional, helps identify products in results)
- `price` - Price in smallest currency unit, e.g., cents for USD, rupiah for IDR (optional)
- `stock` - Stock quantity (optional)

## Important: Preventing Scientific Notation in Excel

TikTok product IDs and SKU IDs are very long numbers (18+ digits). When you open the CSV in Excel or Google Sheets, they will be converted to scientific notation (e.g., 1.73E+18) which breaks the upload.

### Solution 1: Use Apostrophe Prefix (Recommended)
Add a single quote `'` before each productId and skuId:

```csv
productId,skuId,productName,price,stock
'1734282158070260000,'1734282158070335348,Sample Product 1,15000,10
'1734282148160700000,'1734282148160767860,Sample Product 2,18000,5
```

The apostrophe forces Excel to treat the value as text. The backend automatically removes the apostrophe during processing.

### Solution 2: Format as Text First
1. Open a blank Excel file
2. Select columns A and B (productId and skuId)
3. Right-click → Format Cells → Text
4. Then paste or enter your product IDs

### Solution 3: Use Text Editor
Edit the CSV in a text editor (Notepad, VS Code, etc.) instead of Excel to avoid any automatic formatting.

## Example CSV

```csv
productId,skuId,productName,price,stock
'1734282158070260000,'1734282158070335348,Magic Card Alpha,15000,10
'1734282158070260000,'1734282158070335349,Magic Card Beta,18000,5
'1734282148160700000,'1734282148160767860,Pokemon Card Set,25000,8
```

## Template File

Use `tiktok-bulk-update-template.csv` as a starting point. It already includes the apostrophe prefix format.

## Upload Location

Upload your CSV file in the Admin Panel → TikTok Shop Debug page.
