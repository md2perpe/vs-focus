import * as vscode from 'vscode';

function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.focus', cmdFocus),
        vscode.window.onDidChangeActiveTextEditor(doSetDecorations),
    );
}
    
function deactivate() {}


const decorationType = createDecorationType();

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

let dt = new Map<string, { ranges: readonly vscode.Range[] }>();

function cmdFocus(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    
    const ranges = getRanges(editor);
    if (!ranges) {
        return;
    }

    const fileName = editor.document.fileName;
    dt.set(fileName, { ranges });

    doSetDecorations(editor);
}

function getRanges(editor: vscode.TextEditor): readonly vscode.Range[] {
    // When there is no or just an empty selection
    if (editor.selections.length <= 1 && editor.selection.isEmpty) {
        return [];
    }

    return editor.selections;
}

function getFullDocumentRange(editor: vscode.TextEditor): vscode.Range {
    const startDocument = new vscode.Position(0,0);
    const endDocument   = editor.document.lineAt(editor.document.lineCount - 1).rangeIncludingLineBreak.end;
    return new vscode.Range(startDocument, endDocument);
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

    const grayoutRanges = selectionsComplement(decorationInfo.ranges, getFullDocumentRange(editor));

    editor.setDecorations(decorationType, grayoutRanges);
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

module.exports = {
	activate,
	deactivate,
}
