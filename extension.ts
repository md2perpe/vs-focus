import * as vscode from 'vscode';

// Looks for a range in `oldRanges` which contains `range` 
// and splits that in the before and after parts.
function cut(oldRanges: vscode.Range[], range: vscode.Range): vscode.Range[] {
    let newRanges: vscode.Range[] = [];
    oldRanges.forEach((thisOldRange) => {
        if (thisOldRange.contains(range)) {
            newRanges.push(new vscode.Range(thisOldRange.start, range.start), new vscode.Range(range.end, thisOldRange.end));
        } else {
            newRanges.push(thisOldRange);
        }
    });
    return newRanges;
}

function selectionsComplement(selections: readonly vscode.Range[], fullRange: vscode.Range): vscode.Range[] {
    return selections.reduce(cut, [fullRange]);
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

function getRanges(editor: vscode.TextEditor): vscode.Range[] {
    // When there is no or just an empty selection
    if (editor.selections.length <= 1 && editor.selection.isEmpty) {
        return [];
    }

    const startDocument = new vscode.Position(0,0);
    const endDocument   = editor.document.lineAt(editor.document.lineCount - 1).rangeIncludingLineBreak.end;
    const fullDocument = new vscode.Range(startDocument, endDocument);

    return selectionsComplement(editor.selections, fullDocument);
}

function doSetDecorations(editor: vscode.TextEditor|undefined) {
    if (!editor) {
        return;
    }

    const fileName = editor.document.fileName;
    const decorationInfo = dt.get(fileName);
    if (!decorationInfo) {
        return;
    }

    editor.setDecorations(decorationInfo.decorationType, decorationInfo.ranges);
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
