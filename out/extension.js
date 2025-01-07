"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = require('js-yaml');
function findConfigFiles(config, workspaceFolder) {
    const vscodeDir = path.join(workspaceFolder, '.vscode');
    try {
        return fs.readdirSync(vscodeDir)
            .filter(file => file.startsWith(config) && file.endsWith('.yaml'))
            .map(file => path.join(vscodeDir, file));
    }
    catch (error) {
        console.error('Error reading .vscode directory:', error);
        return [];
    }
}
function compileYamlToJson(config, workspaceFolder) {
    let output = {};
    let macros = {};
    const files = findConfigFiles('launch', workspaceFolder);
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const data = yaml.load(content);
        if (data.macros) {
            macros = { ...macros, ...data.macros };
            delete data.macros;
        }
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null && 'macro' in value) {
                output[key] = parseMacro(macros[value.macro], value);
            }
            else {
                output[key] = value;
            }
        }
    }
    const outputPath = path.join(path.dirname(files[0]), `${config}.json`);
    try {
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`JSON output saved to ${outputPath}`);
    }
    catch (error) {
        console.error('Error writing JSON file:', error);
    }
}
function parseMacro(macroDef, paramDict) {
    if (Array.isArray(macroDef)) {
        return parseListMacro(macroDef, paramDict);
    }
    else if (typeof macroDef === 'object') {
        return parseDictMacro(macroDef, paramDict);
    }
    else if (typeof macroDef === 'string') {
        return parseStringMacro(macroDef, paramDict);
    }
    return macroDef;
}
function parseDictMacro(macroDef, paramDict) {
    let result = {};
    for (const [key, value] of Object.entries(macroDef)) {
        result[key] = parseMacro(value, paramDict);
    }
    return result;
}
function parseListMacro(macroDef, paramDict) {
    return macroDef.map(item => parseMacro(item, paramDict));
}
function parseStringMacro(macroDef, paramDict) {
    let result = macroDef;
    for (const [key, value] of Object.entries(paramDict)) {
        if (key !== 'macro') {
            result = result.replace(new RegExp(`\\$\\(${key}\\)`, 'g'), String(value));
        }
    }
    return result;
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vs-json-macros" is now active!');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        console.error('No workspace folder found');
        return;
    }
    compileYamlToJson('launch', workspaceFolder);
    compileYamlToJson('tasks', workspaceFolder);
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('vs-json-macros.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from vs-json-macros!');
    });
    context.subscriptions.push(disposable);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map