function processPostEditRows(data) {
    // Get the active spreadsheet
  
    function sendToOpenAI(promptText) {
    var apiKey = 'your_api_key'; // Replace with your OpenAI API key
    var apiUrl = 'https://api.openai.com/v1/chat/completions'; // Updated endpoint for GPT-3.5 Turbo


    // prepare prompt
    let rule = 'Please use %% before starting comment. And must include both the translation and comment in the response. Do not inlude any word before the translation.';
    if(data.comment){
     data.postEditPrompt = data.postEditPrompt + " you need to Provide a seperate short 1 or 2 sentence(comment) explanation for your changes to MT output and follow: "+ rule;
    }
    // Prepare the request payload
    var requestData = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: data.postEditPrompt
        },
        {
          role: 'user',
          content: "instruction: must respond in the  "+ data.postEditTarget +" language, Prompt is: "+ promptText

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
    return responseBody;
  } 
  
  function showWrongRowsAlert() {
    // Display an alert about the wrong rows range
    var message = 'You have selected the wrong rows range. Please choose a valid range.';
    var title = 'Invalid Rows Range';
    Browser.msgBox(message, title, Browser.Buttons.OK);
    }
    
    function postUpdate(firstIndex,lastIndex,sheet)
    {
    // Loop through all rows from D2 where there is text in column B+C
    if(firstIndex > 1 && firstIndex < lastIndex && lastIndex <= sheet.getLastRow())
    {
    for (var row = firstIndex; row <= lastIndex; ++row) {
      // Check if column C is not empty for the current row
      var sourceTargetCell = sheet.getRange(row, 3);
      if (sourceTargetCell.getValue() !== "") {
        // Logger.log("Processing Post-Edit row " + row);
        
        // Prepare the prompt for OpenAI
        var promptText = `Source: ${sheet.getRange(row, 2).getValue()}, Machine Translation: ${sourceTargetCell.getValue()}`;
  
        // Send text to OpenAI
        var openAIResponse = sendToOpenAI(promptText);
        var res = openAIResponse.choices[0].message['content'];
        let total_tokens = openAIResponse.usage.total_tokens;
        let promptTokensPrice = openAIResponse.usage.prompt_tokens * 0.00003;
        let completionTokensPrice = openAIResponse.usage.completion_tokens * 0.00006;
        let totalTokensPrice = promptTokensPrice + completionTokensPrice;
        // Check if Comment request is ticked
      if(data.comment){
        let index = res.indexOf('%%');
        let response = res.substring(0, index);
        let comment = res.substring(index + 2);
        sheet.getRange(row,4).setValue(response);
        sheet.getRange(row,9).setValue(comment);
        sheet.getRange(row, 16).setValue(total_tokens);
        sheet.getRange(row, 17).setValue('$' + totalTokensPrice);
      }
      else{
        sheet.getRange(row,4).setValue(res);
        sheet.getRange(row, 16).setValue(total_tokens);
        sheet.getRange(row, 17).setValue('$' + totalTokensPrice);
      }
      }
    }
  }
  else{
    showWrongRowsAlert();
  }
}

   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

   if(data.rowPostEdit)
   {
     postUpdate(data.startRow,data.endRow,sheet);
   }
   else
   {
    postUpdate(2, sheet.getLastRow(),sheet);
   }
   
    // Save any changes to the tab
    SpreadsheetApp.flush();
}