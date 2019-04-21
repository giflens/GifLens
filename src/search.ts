import * as vscode from 'vscode';

import { searchGif } from './utils';

const webviewHtml: (imagesHtml: string) => string = (imagesHtml: string) =>
	`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Search Gif</title>
    </head>
    <body>
        ${imagesHtml}
        <script>
        // acquiring the vscode webview specific api to send messages to the extension
        const vscode = acquireVsCodeApi();

        // finding the images and putting them into an array
        const searchImages = document.getElementsByClassName('search-img');
        var arr = [...searchImages];

        // event handler that sends back to the extension the url of the clicked gif
        const sendUrl = event => {
          const url = event.target.getAttribute('src');
          vscode.postMessage({
            command: 'url',
            text: url,
          });
        };
        
        // attaching the click listener to each image
        arr.forEach(gifItem => {gifItem.addEventListener('click', sendUrl)})
        
        </script>
    </body>
    </html>`;

const search = async (editor: vscode.TextEditor) => {
	// grabbing the current location to insert the edit later with the GIFLENS tag
	const position: vscode.Position = editor.selection.active;
	// The code you place here will be executed every time your command is executed
	const searchInput: string | undefined = await vscode.window.showInputBox({
		placeHolder: 'your gif search',
		prompt: 'Enter your search, and press Enter',
	});
	if (searchInput) {
		const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
			'gifSearch', // Identifies the type of the webview. Used internally
			'Gif Results', // Title of the panel displayed to the user
			vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
			{
				enableScripts: true,
			} // Webview options. authorizes js
		);

		// part about getting the data and creating the img html tags for the images.
		const searchResults: string[] = await searchGif(searchInput);
		const images: string = createImages(searchResults);

		// urlToUse is defined with a promise that will be resolved once the click event is fired
		const urlToUse = await new Promise(resolve => {
			panel.webview.html = webviewHtml(images);

			// create a listener to the webview to catch when the user clicks the image he has selected
			const subscription: vscode.Disposable = panel.webview.onDidReceiveMessage(
				message => {
					switch (message.command) {
						case 'url':
							// resolve the promise to the url of the picture
							resolve(message.text);
							// dispose of the subscription to the webview messages
							subscription.dispose();
							// dispose of the webview
							panel.dispose();
							return;
					}
				}
			);
		});

		editor.edit(editBuilder => {
			const lineBeginningChars: number = editor.document.lineAt(position)
				.firstNonWhitespaceCharacterIndex;
			// goes to the beginning of the line to create the GIFLENS tag the line above after insertion
			let positionToInsert = new vscode.Position(position.line, 0);
			// TODO when the line is empty, do not create an extra line (remove the \r)
			editBuilder.insert(
				positionToInsert,
				`${
					// insertSpaces returns false if the user uses tabs, true if the user uses spaces
					// it is defined per document in VSCode, so if the user voluntarily changes it on one line, this code will not work
					editor.options.insertSpaces
						? // returns the correct indentation character for the user
						  ' '.repeat(lineBeginningChars)
						: '\t'.repeat(lineBeginningChars)
				}${getLanguageCommentStart()} GIFLENS-${urlToUse}\r`
				// \r is used to create a new line, VSCode converts automatically to the end of line of the current OS
			);
		});
	} else {
		vscode.window.showInformationMessage('You have to enter your GIF search');
	}
};

const createImages: (urls: string[]) => string = (urls: string[]) => {
	return urls.map(url => `<img class="search-img" src="${url}" />`).join('');
};

// for later, maybe find the comment characters from the current language
const getLanguageCommentStart = () => '//';

export default search;
