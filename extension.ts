import * as vscode from 'vscode';

function cut(min: vscode.Position, max: vscode.Position, current: any[]): [vscode.Position, vscode.Position][] {
    let currentNew: [vscode.Position, vscode.Position][] = [];
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


function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.focus', doFocus),
        vscode.window.onDidChangeActiveTextEditor(doSetDecorations),
    );
}
    
let dt = new Map<string, { ranges: vscode.Range[], decorationType: vscode.TextEditorDecorationType }>();

function doFocus(): void {
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
    if (dt.has(fileName)) {
        dt.get(fileName)!.decorationType.dispose();
    }
    dt.set(fileName, { ranges, decorationType });
    doSetDecorations(editor);
}

function getRanges(editor: vscode.TextEditor): vscode.Range[]|undefined {
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

function doSetDecorations(editor: vscode.TextEditor|undefined) {
    if (!editor) {
        return;
    }

    const fileName = editor.document.fileName;
    if (!dt.has(fileName)) {
        return;
    }

    editor.setDecorations(dt.get(fileName)!.decorationType, dt.get(fileName)!.ranges);
}

function createDecorationType() {
    const decorationOptions: vscode.DecorationRenderOptions = {
        opacity: vscode.workspace.getConfiguration('vsfocus').get<string>('opacity') + " !important",
    }
    const color = vscode.workspace.getConfiguration('vsfocus').get<vscode.ThemeColor>('color');
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
