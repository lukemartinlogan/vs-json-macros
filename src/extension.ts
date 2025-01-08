// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
const yaml = require('js-yaml');

function findConfigFiles(config: string, workspaceFolder: string): string[] {
  const vscodeDir = path.join(workspaceFolder, '.vscode');

  try {
    return fs.readdirSync(vscodeDir)
        .filter(file => file.startsWith(config) && file.endsWith('.yaml'))
        .map(file => path.join(vscodeDir, file));
  } catch (error) {
    console.error('Error reading .vscode directory:', error);
    return [];
  }
}

function compileYamlToJson(config: string, workspaceFolder: string): any {
  let output: any = {};
  let macros: any = {};
  const files = findConfigFiles(config, workspaceFolder);
  if (files.length === 0) {
    return;
  }
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const data = yaml.load(content);

    // Check if OS is Windows
    const isWin = process.platform === 'win32';

    // Check if requirements exist and match current OS
    if (data && data.requirements && data.requirements.os) {
      const targetOs = data.requirements.os;
      if ((isWin && targetOs !== 'windows') ||
          (!isWin && targetOs === 'windows')) {
        continue;
      }
      delete data.requirements;
    }

    // Get macros section
    if (data.macros) {
      macros = {...macros, ...data.macros};
      delete data.macros;
    }

    // Concatenate descendMacro with output
    output = {...output, ...descendMacro(data, macros)};
  }

  const outputPath = path.join(path.dirname(files[0]), `${config}.json`);
  try {
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`JSON output saved to ${outputPath}`);
  } catch (error) {
    console.error('Error writing JSON file:', error);
  }
}

function descendMacro(data: any, macros: any): any {
  if (typeof data === 'string') {
    return data;
  } else if (Array.isArray(data)) {
    let output: any = [];
    output = data.map(item => {
      if (typeof item === 'object' && item !== null && 'macro' in item) {
        return parseMacro(macros[(item as {macro: string}).macro], item);
      } else {
        return descendMacro(item, macros);
      }
    });
    return output;
  } else if (typeof data === 'object') {
    let output: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null && 'macro' in value) {
        output[key] =
            parseMacro(macros[(value as {macro: string}).macro], value);
      } else {
        output[key] = descendMacro(value, macros);
      }
    }
    return output;
  } else {
    return data;
  }
}

function parseMacro(macroDef: any, paramDict: any): any {
  if (typeof macroDef === 'string') {
    return parseStringMacro(macroDef, paramDict);
  } else if (Array.isArray(macroDef)) {
    return parseListMacro(macroDef, paramDict);
  } else if (typeof macroDef === 'object') {
    return parseDictMacro(macroDef, paramDict);
  }
  return macroDef;
}

function parseDictMacro(macroDef: any, paramDict: any): any {
  let result: any = {};
  for (const [key, value] of Object.entries(macroDef)) {
    result[key] = parseMacro(value, paramDict);
  }
  return result;
}

function parseListMacro(macroDef: any[], paramDict: any): any[] {
  const output = macroDef.map(item => parseMacro(item, paramDict));
  if (!Array.isArray(output)) {
    console.log('is not array');
  } else {
    console.log('is array');
  }
  return output;
}

function parseStringMacro(macroDef: string, paramDict: any): string {
  let result = macroDef;
  for (const [key, value] of Object.entries(paramDict)) {
    if (key !== 'macro') {
      result =
          result.replace(new RegExp(`\\$\\(${key}\\)`, 'g'), String(value));
    }
  }
  return result;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors
  // (console.error) This line of code will only be executed once when your
  // extension is activated
  console.log('Type jsonify to recompile your vscode yamls into json!');


  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable =
      vscode.commands.registerCommand('vs-json-macros.jsonify', () => {
        // The code you place here will be executed every time your command is
        // executed
        const workspaceFolder =
            vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
          console.error('No workspace folder found');
          return;
        }
        compileYamlToJson('launch', workspaceFolder);
        compileYamlToJson('tasks', workspaceFolder);
      });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
