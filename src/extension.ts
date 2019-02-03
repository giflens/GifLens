// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "giflens" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('giflens', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello Giflens!');
	});

	// TODO DELETE
	vscode.window.showInformationMessage('Starting Giflens!');
	let myDecorationOptions = {
    color: "blue",
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
  };
	let myTextDecoration = vscode.window.createTextEditorDecorationType(
		myDecorationOptions
	);
	vscode.window.onDidChangeActiveTextEditor(event => {
		// debugger
		let begin = new vscode.Position(0,0);
		let end = new vscode.Position(0, 4);
		// TODO replace by regexp to find the text we want
		let myrange = new vscode.Range(begin, end);
		if(vscode.window.activeTextEditor){
			vscode.window.activeTextEditor.setDecorations(
				myTextDecoration,
				[
					{
						range: myrange,
						hoverMessage:
							"![Image of Yaktocat](https://media.giphy.com/media/l0Iy69RBwtdmvwkIo/giphy.gif)"
					}
				]
			);
		} 
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
