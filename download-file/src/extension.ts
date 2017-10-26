'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as http from "http"

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.downloadFile', () => {
    vscode.window.showInputBox({ prompt: 'Enter file URL you wish to download' }).then((res) => {
      validateAndSaveFIle(res, vscode.workspace.workspaceFolders[0].uri.fsPath);
    });
  });
  context.subscriptions.push(disposable);
}

function validateAndSaveFIle (fileURL, dest, cb = null) {
  let fileName = fileURL
  
  http.get(fileURL, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];
  
    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      //error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.error(error.message);
      // consume response data to free up memory
      res.resume();
      return;
    }
  
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        // const parsedData = JSON.parse(rawData);
        fs.appendFile(dest + `/message.txt`, rawData, (err) => {
          if (err) throw err;
          console.log('The "data to append" was appended to file!');
        });
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });

}

// this method is called when your extension is deactivated
export function deactivate() {
}