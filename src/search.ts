import * as vscode from 'vscode';

import { searchGif } from './utils';

const search = async (editor: vscode.TextEditor) => {
	// TODO check that the selection is empty
	// TODO check that we are in a comment
	const position = editor.selection.active;
	// creating a container to collect the url of the image selected
	// let urlToUse: string = '';
	// The code you place here will be executed every time your command is executed
	const searchInput = await vscode.window.showInputBox({
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
			panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Search Gif</title>
    </head>
    <body>
        ${images}
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

			// create a listener to the webview to catch when the user clicks the image he has selected
			const subscription = panel.webview.onDidReceiveMessage(message => {
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
			});

			// TODO manage the case when the user closes the window without picking an image
		});

		editor.edit(editBuilder => {
			let positionToInsert = new vscode.Position(position.line, 0);
			editBuilder.insert(
				positionToInsert,
				`${getLanguageCommentStart()} GIFLENS-${urlToUse}\r`
			);
		});
	} else {
		vscode.window.showInformationMessage('You have to enter your GIF search');
	}
};

const createImages = (urls: string[]) => {
	let images: string = '';
	for (let url of urls) {
		images += `<img class="search-img" src="${url}" />`;
	}
	return images;
};

const getLanguageCommentStart = () => '//';

export default search;
