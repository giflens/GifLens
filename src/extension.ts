// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import searchHandler from './search';

const giflensRegexp = /GIFLENS-((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

// COPY HERE

// https://github.com/Microsoft/vscode-go/blob/86605f89ca43c865f511afb1d464a35eb8c8733e/src/goDeclaration.ts#L70-L82

vscode.languages.registerHoverProvider('*', {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.Hover | null {
		const range = document.getWordRangeAtPosition(position, giflensRegexp);

		if (range) {
			const url = document.getText(
				range.with(
					new vscode.Position(range.start.line, range.start.character + 8)
				)
			);
			return new vscode.Hover(`![GIF](${url})`);
		} else {
			return null;
		}
	},
});

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "giflens" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable: vscode.Disposable = vscode.commands.registerTextEditorCommand(
		'giflens',
		(textEditor: vscode.TextEditor) => {
			searchHandler(textEditor, context);
		}
	);

	// TODO DELETE
	vscode.window.showInformationMessage('Starting Giflens!');

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
