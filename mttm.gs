async function processmttm(data) {

  // Function to get Google Translate of a text
 async function getGoogleTranslate(cell, UpdateCell) {
    var cellText = cell.getValue();
    let  translatedText = LanguageApp.translate(cellText, data.mtSource, data.mtTarget);
    // Update the cell formula, not the entire cell
    if(cell.getValue() !== "")
    {
       UpdateCell.setValue(translatedText);
    }
  }

  async function sendToOpenAI(promptText) {
  // Prepare prompt
  let rule = ' Please use %% before starting comment. And must include both the translation and comment in the response. Do not inlude any word before the translation.';
    if(data.comment){
      data.tmPrompt = data.tmPrompt + " you need to Provide a seperate short 1 or 2 sentence explanation for your changes to MT output and follow "+ rule;
    }
    var apiKey = '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'; // Replace with your OpenAI API key
    var apiUrl = 'https://api.openai.com/v1/chat/completions'; // Updated endpoint for GPT-3.5 Turbo

  // Prepare the request payload
  var requestData = {
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: data.tmPrompt
      },
      {
        role: 'user',
        content: "instruction: must respond to the  "+ data.tmTarget +" language, Prompt is: "+ promptText
      }
    ]
    // Add any other required parameters
  };

  // Set up the options for the HTTP request
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    payload: JSON.stringify(requestData)
  };
  // Make the request
  var response = UrlFetchApp.fetch(apiUrl, options);

  // Parse and return the response content
  var responseBody = JSON.parse(response.getContentText());
  // return responseBody.choices[0].message['content'];
  return responseBody;
}

function showWrongRowsAlert() {
// Display an alert about the wrong rows range
var message = 'You have selected the wrong rows range. Please choose a valid range.';
var title = 'Invalid Rows Range';
Browser.msgBox(message, title, Browser.Buttons.OK);
}

  // Function to process rows in the sheet
  async function processRows(firstIndex, lastIndex,sheet) {

    // Loop through all rows from C2 where there is text in column B
    if(firstIndex > 1 && firstIndex < lastIndex && lastIndex <= sheet.getLastRow())
    {
    for (var row = firstIndex; row <= lastIndex; ++row) {
      // Check if column C is empty for the current row
      var promptCell = sheet.getRange(row,3);
      var transCell = sheet.getRange(row,2);
      if (promptCell.getValue() === "" && transCell.getValue() !== "") {
        Logger.log("Translating row " + row);
        // Get Google Translate of text in B2
       await getGoogleTranslate(transCell, promptCell); // Pass the entire promptCell Range
       
      } else if(promptCell.getValue() !== ""){
        // Send text in prompt to OpenAI
        var openAIResponse  = await sendToOpenAI(`Source: ${transCell.getValue()}, Fuzzy Match Translation: ${promptCell.getValue()})`);
        //Getting actual response from openAI's response
        let actualResponse = openAIResponse.choices[0].message['content'];
        //Getting total number of tokens used from openAI's response
        let total_tokens = openAIResponse.usage.total_tokens;
        let promptTokensPrice = openAIResponse.usage.prompt_tokens * 0.00003;
        let completionTokensPrice = openAIResponse.usage.completion_tokens * 0.00006;
        let totalTokensPrice = promptTokensPrice + completionTokensPrice;
        if(data.comment)
        {
          let res = actualResponse;
          let index = res.indexOf('%%');  // Corrected from rule.indexOf to res.indexOf
          let response = res.substring(0, index);
          let comment = res.substring(index + 2);
          //Assigning value to Column C
          sheet.getRange(row, 3).setValue(response);
          //Assigning value to Column H
          sheet.getRange(row, 8).setValue(comment);
          //Assigning value to Column K
          sheet.getRange(row, 14).setValue(total_tokens);
          //Assigning value to Column L
          sheet.getRange(row, 15).setValue('$' + totalTokensPrice);
        }
        else{
          // Assigning value to Column C
          sheet.getRange(row, 3).setValue(actualResponse);
          //Assigning value to Column K
          sheet.getRange(row, 14).setValue(total_tokens);
          //Assigning value to Column L
          sheet.getRange(row, 15).setValue( '$'+ totalTokensPrice);
        }
      }
    }
  }
  else{
      showWrongRowsAlert();  
      }
    // Save any changes to the tab
    SpreadsheetApp.flush();
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Call the processRows function

  if(data.rowMTTM)
  {
  await processRows(data.startRow, data.endRow,sheet);
  }
  else{
    await  processRows(2, sheet.getLastRow(),sheet);
  }
  return true;
}