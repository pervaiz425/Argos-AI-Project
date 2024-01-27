// Code.gs

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Argos AI')
    .addItem('Smart AI', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('app')
    .setTitle('SmartAI')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}




function processForm(selectedLanguage) {
  // Log the selected language (for demonstration purposes)
  Logger.log('Selected Language:', selectedLanguage);

  // You can perform further actions with the selected language if needed
  // For example, make an API call with the language code

  // Return a response if needed
  return 'Form data processed successfully';
}

