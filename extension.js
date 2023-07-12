const vscode = require('vscode');

function cut(min, max, current) {
    let currentNew = [];
    current.forEach(item => {
        if(min.isAfterOrEqual(item[0]) && max.isBeforeOrEqual(item[1])){
            currentNew.push([item[0], min], [max, item[1]])
            return;
        }else{
            currentNew.push([item[0], item[1]])
            return;
        }
    });
    return currentNew;
}


/**
 * @param {vscode.ExtensionContext} context
*/
function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.focus', doFocus),
        vscode.window.onDidChangeActiveTextEditor(doSetDecorations),
    );
}
    
let dt = new Map();

function doFocus() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    
    const ranges = getRanges(editor);
    if (!ranges) {
        return;
    }

    const decorationType = createDecorationType();

    const fileName = editor.document.fileName;
    if (dt[fileName]) {
        dt[fileName].decorationType.dispose();
    }
    dt[fileName] = { ranges, decorationType };
    doSetDecorations(editor);
}

function getRanges(editor) {
    let startSelection = editor.selection.start;
    let endSelection   = editor.selection.end;

    let startDocument = new vscode.Position(0,0);
    let endDocument   = editor.document.lineAt(editor.document.lineCount - 1).rangeIncludingLineBreak.end;

    if (editor.selections.length <= 1 &&
        startSelection.line == endSelection.line &&
        startSelection.character == endSelection.character
    ) {
        return undefined;
    }

    return editor.selections.reduce((megaRange, selection) => {
        return cut(selection.start, selection.end, megaRange)
    }, [[startDocument, endDocument]]).map((item) => {
        return new vscode.Range(item[0], item[1]);
    });
}

function doSetDecorations(editor) {
    const fileName = editor.document.fileName;
    if (!dt[fileName]) {
        return;
    }

    editor.setDecorations(dt[fileName].decorationType, dt[fileName].ranges);
}

function createDecorationType() {
    const decorationOptions = {
        opacity: vscode.workspace.getConfiguration('vsfocus').get('opacity') + " !important",
    }
    const color = vscode.workspace.getConfiguration('vsfocus').get('color');
    if(color) {
        decorationOptions.color = color;
    }

    return vscode.window.createTextEditorDecorationType(decorationOptions);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
}
