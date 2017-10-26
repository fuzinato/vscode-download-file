'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as url from "url";
import * as mkdirp from "mkdirp";
import * as http from "http";
import * as https from "https";

export function activate(context: vscode.ExtensionContext) {
  
  let disposable = vscode.commands.registerCommand('extension.downloadFile', () => {
    
    const configParams = vscode.workspace.getConfiguration('download-file'),
      defaultFolder = vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + configParams.get('defaultFolder') as string;
      
    vscode.window.showInputBox({ prompt: 'Enter file URL you wish to download' }).then((res) => {
      if (!res) {
        vscode.window.showErrorMessage("Please enter valid URL!");
        return;
      }
      fetchAndSaveFile(res, defaultFolder);
    });
  });
  context.subscriptions.push(disposable);
}

function fetchAndSaveFile(fileURL, dest) {
  const timeout = 10000,
    urlParsed = url.parse(fileURL),
    uri = urlParsed.pathname.split('/');
  let req,
    filename = (uri[uri.length - 1].match(/(\w*\.?-?)+/))[0];

  if (urlParsed.protocol === null) {
    fileURL = 'http://' + fileURL;
  }

  req = (urlParsed.protocol === 'https:') ? https : http; 

  let request = req.get(fileURL, function(response) {
    
    // Make sure extension is present (mostly for images)
    if (filename.indexOf('.') < 0) {
      const contentType = response.headers['content-type'];
      filename += `.${contentType.split('/')[1]}`;
    }

    const targetPath = `${dest}/${filename}`;

    if (response.statusCode === 200) {

      mkdirp(dest, function(err) { 
        if (err) {
          throw err;
        }
        var file = fs.createWriteStream(targetPath);
        response.pipe(file);
      });

    } else {
      vscode.window.showErrorMessage(`Downloading ${fileURL} failed`);
    }

    response.on("end", function(){
      vscode.window.showInformationMessage(`File "${filename}" downloaded successfully.`);
    })

    request.setTimeout(timeout, function () {
      request.abort();
    })

  }).on('error', function(e) {
    vscode.window.showErrorMessage(`Downloading ${fileURL} failed! Please make sure URL is valid.`);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {
}