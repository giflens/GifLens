// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const myTextDecoration = vscode.window.createTextEditorDecorationType({
	color: "pink",
	rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
});

const giflensRegexp = /GIFLENS ((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g;

// COPY HERE 

// https://github.com/Microsoft/vscode-go/blob/86605f89ca43c865f511afb1d464a35eb8c8733e/src/goDeclaration.ts#L70-L82

vscode.languages.registerHoverProvider("*", {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.Hover {
			const editorText = document.getText();
			let match;
			const results = [];
			while ((match = giflensRegexp.exec(editorText))) {
				results.push({
					index: match.index,
					url: match[1],
					fullTagMatch: match[0]
				});
			}
			// debugger;
			const myRanges:vscode.Range[] = [];
			results.forEach(gifTag => {
				//   let begin = new vscode.Position(0, 0);
				//   let end = new vscode.Position(0, 4);
				const startPos = document.positionAt(gifTag.index);
				const endPos = document.positionAt(gifTag.index + gifTag.fullTagMatch.length);
				myRanges.push(new vscode.Range(startPos, endPos));
			});
			
			if (myRanges.some(range => range.contains(position))) {
				return new vscode.Hover(
				"![Image of Yaktocat](https://media.giphy.com/media/l0Iy69RBwtdmvwkIo/giphy.gif)"
				);
			} 
			return new vscode.Hover("rien");

		// if (
		// 	document.getText(document.getWordRangeAtPosition(position)) ===
		// 	"GIF"
		// ) {
		// 	return new vscode.Hover(
		// 		"![Image of Yaktocat](https://media.giphy.com/media/l0Iy69RBwtdmvwkIo/giphy.gif)"
		// 	);
		// } else {
		// 	return new vscode.Hover("rien");
		// }
	}
});



// const enableGifHover = (document: vscode.TextDocument) => {
//   if (document) {
//     const editorText = document.getText();
//     // const results = editorText.match(giflensRegexp);
//     let match;
//     const results = [];
//     while ((match = giflensRegexp.exec(editorText))) {
//       results.push({
//         index: match.index,
//         url: match[1],
//         fullTagMatch: match[0]
//       });
//     }
//     // debugger;
//     results.forEach(gifTag => {
// 		//   let begin = new vscode.Position(0, 0);
// 		//   let end = new vscode.Position(0, 4);
// 		const startPos = document.positionAt(gifTag.index);
// 		const endPos = document.positionAt(gifTag.index + gifTag.fullTagMatch.length);
//       	// TODO replace by regexp to find the text we want
// 		let myrange = new vscode.Range(startPos, endPos);
// 		if (vscode.window.activeTextEditor) {
// 			vscode.window.activeTextEditor.setDecorations(myTextDecoration, [
// 			{
// 				range: myrange,
// 				hoverMessage:
// 				"![Enjoy your Gif](https://media.giphy.com/media/l0Iy69RBwtdmvwkIo/giphy.gif)"
// 			}
// 			]);
// 		}
//     });
//   }
// };

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
	
	// DOES NOT WORK vscode.window.onDidChangeWindowState(event => {
	// vscode.window.onDidChangeActiveTextEditor(event => {
	vscode.window.onDidChangeVisibleTextEditors(event => {
		const document =
	  event && event[0] && event[0].document;
	// 	let begin = new vscode.Position(0, 0);
	// 	const getGifTagRange =
    //   event && event[0] && event[0].document && event[0].document.getWordRangeAtPosition();
		// enableGifHover(document);
	});
	  
	// also triggering on extension load
	// TODO get text of current editor
	// activeEditor.document
	// let activeEditor = vscode.window.activeTextEditor;
	// if (activeEditor) {
	// 	enableGifHover(activeEditor.document);
	// }

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
