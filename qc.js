function processQCRows(data) {
  function sendToOpenAI(promptText) {
    var apiKey = "your_api_key"; // Replace with your OpenAI API key
    var apiUrl = "https://api.openai.com/v1/chat/completions"; // Updated endpoint for GPT-3.5 Turbo

    // Prepare the request payload
    let rule =
      `Use the Microsoft Style Guide for the target language. Return a JSON object with the following structure: { "translation": "","score": , "feedback": }. Must include translation, score and feedback in the response.` ;
    var requestData = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: data.qcPrompt + rule
        },
        {
          role: "user",
          content:
            "instruction: must respond to the  " +
            data.qcTarget +
            " language, Prompt is: " +
            promptText
        },
      ],
      // Add any other required parameters
    };

    // Set up the options for the HTTP request
    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + apiKey,
      },
      payload: JSON.stringify(requestData),
    };

    // Make the request
    var response = UrlFetchApp.fetch(apiUrl, options);

    // Parse and return the response content
    var responseBody = JSON.parse(response.getContentText());
    return responseBody;
  }

  function showWrongRowsAlert(msg) {
    // Display an alert about the wrong rows range
    var message = msg;
    var title = "Invalid Rows Range";
    Browser.msgBox(message, title, Browser.Buttons.OK);
  }

  function qcRows(firstRow, lastRow, sheet) {
    // Loop through all rows from E2 where there is text in column B+D
    try {
      if (firstRow > 1 && firstRow < lastRow && lastRow <= sheet.getLastRow()) {
        for (var row = firstRow; row <= lastRow; ++row) {
          // Check if column D is not empty for the current row
          var sourceTargetCell = sheet.getRange(row, 4);
          if (sourceTargetCell.getValue() !== "") {
            Logger.log("Processing QC row " + row);

            // Prepare the prompt for OpenAI
            var promptText = `Source Translation: ${sheet.getRange(row, 2).getValue()}, Target Translation: ${sourceTargetCell.getValue()}`;

            // Send text to OpenAI
            var openAIResponse = sendToOpenAI(promptText);
            let actualResponse = JSON.parse(openAIResponse.choices[0].message["content"]);
            let totalTokens = openAIResponse.usage.total_tokens;
            let promptTokensPrice = openAIResponse.usage.prompt_tokens * 0.00003;
            let completionTokensPrice = openAIResponse.usage.completion_tokens * 0.00006;
            let totalTokensPrice = promptTokensPrice + completionTokensPrice;
            // Update columns E, F, G with OpenAI response and score
            sheet.getRange(row, 5).setValue(actualResponse.translation);
            sheet.getRange(row, 6).setValue(actualResponse.feedback); // Placeholder for F column, adjust as needed
            sheet.getRange(row, 7).setValue(actualResponse.score); // Assuming score is available in the response
            sheet.getRange(row, 18).setValue(totalTokens);
            sheet.getRange(row, 19).setValue('$' + totalTokensPrice);


            // Note: Comment handling is not needed in this step, so it's not included
          }
        }
      } else {
        showWrongRowsAlert();
      }
    } catch (e) {
      showWrongRowsAlert(e);
    }
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (data.rowQC) {
    qcRows(data.startRow, data.endRow, sheet);
  } else {
    qcRows(2, sheet.getLastRow(), sheet);
  }
  // Save any changes to the tab
  SpreadsheetApp.flush();
}