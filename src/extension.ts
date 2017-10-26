'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as http from "http";
import * as https from "https";
import * as mkdirp from "mkdirp";
import * as url from "url";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.downloadFile', () => {
    vscode.window.showInputBox({ prompt: 'Enter file URL you wish to download' }).then((res) => {
      if (!res) {
        vscode.window.showErrorMessage("Please enter valid URL!");
        return;
      }
      validateAndSaveFIle(res, vscode.workspace.workspaceFolders[0].uri.fsPath);
    });
  });
  context.subscriptions.push(disposable);
}

function validateAndSaveFIle(fileURL, dest) {
  const timeout = 20000,
    urlParsed = url.parse(fileURL),
    uri = urlParsed.pathname.split('/');
  let req,
    filename = (uri[uri.length - 1].match(/(\w*\.?)+/))[0];

  if (urlParsed.protocol === null) {
    fileURL = 'http://' + fileURL;
  }

  req = (urlParsed.protocol === 'https:') ? https : http; 

/* 
  req.get(fileURL, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];
console.log(filename, contentType)
    if (filename.indexOf('.') < 0) {
      filename += `.${contentType.split('/')[1]}`;
    }
    const targetPath = `${dest}/${filename}`;

    if (statusCode !== 200) {
      vscode.window.showErrorMessage(`Downloading ${fileURL} failed`);
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        // const parsedData = JSON.parse(rawData);
        fs.appendFile(dest + '/' + filename, rawData, (err) => {
          if (err) throw err;
          console.log('The "data to append" was appended to file!');
        });
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    vscode.window.showErrorMessage(`Downloading ${fileURL} failed! Please make sure URL is valid.`);
  }); */

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
      vscode.window.showInformationMessage(`File "${filename}" successfully downloaded.`);
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