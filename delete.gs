function clearDataFromColumn(obj) {
 var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
 var sheet = spreadsheet.getActiveSheet();

 if (typeof obj.col === 'object') {
   // Clear multiple columns
   var colsToClear = [obj.col.col1 - 1, obj.col.col2 - 1, obj.col.col3 - 1]; // Adjust for 0-based indexing

   if (obj.row) {
     // Clear specific rows within the specified columns
     var startRow = obj.startRow;
     var endRow = obj.endRow;
     sheet.getRange(startRow, colsToClear[0], endRow - startRow + 1, colsToClear.length).clearContent();
   } else {
     // Clear entire columns from row 2 onwards
     var lastRow = sheet.getLastRow();
     sheet.getRange(2, colsToClear[0], lastRow - 1, colsToClear.length).clearContent();
   }

 } else if (obj.row) {
   if (typeof obj.row === 'object') {
     // Clear entire rows
     var rowsToClear = obj.row;
     sheet.deleteRows(rowsToClear);
   } else {
     // Clear data within specified range
     var col = obj.col - 1; // Adjust for 0-based indexing
     var startRow = obj.startRow;
     var endRow = obj.endRow;
     sheet.getRange(startRow, col, endRow - startRow + 1, 1).clearContent();
   }

 } else {
   // Clear single column from row 2 onwards
   var col = obj.col - 1; // Adjust for 0-based indexing
   var lastRow = sheet.getLastRow();
   sheet.getRange(2, col, lastRow - 1, 1).clearContent();
 }

 // Log a message to confirm completion
 Logger.log("Data cleared in specified columns and rows.");
}
