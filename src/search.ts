import * as vscode from 'vscode';
import { url } from 'inspector';

const search = async () => {
	// creating a container to collect the url of the image selected
	// let urlToUse: string = '';
	// The code you place here will be executed every time your command is executed
	let searchInput = await vscode.window.showInputBox({
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
		const searchResults: string[] = await fakeData();
		const images: string = createImages(searchResults);

		const urlToUse = await new Promise(resolve => {
			panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <body>
        ${images}
        <div class="test">Hello</div>
        <script>
        const test = document.getElementsByClassName('test');
        test.innerHtml="script runs";
        const vscode = acquireVsCodeApi();
        const searchImages = document.getElementsByClassName('search-img');
        const sendUrl = event => {
          console.log("clicked");
          const url = event.target.getAttribute('src');
          vscode.postMessage({
            command: 'url',
            text: url,
          });
        };
        var arr = [...searchImages];
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
						subscription.dispose();
						panel.dispose();
						return;
				}
			});
		});
		console.log(urlToUse);
	} else {
		vscode.window.showInformationMessage('You have to enter your GIF search');
	}
};

const fakeData = () => [
	'https://media.giphy.com/media/2ywgbxmJyIoKdVaYew/giphy-downsized-large.gif',
	'https://media.giphy.com/media/2ywgbxmJyIoKdVaYew/giphy-downsized-large.gif',
];

const createImages = (urls: string[]) => {
	let images: string = '';
	for (let url of urls) {
		images += `<img class="search-img" src="${url}" />`;
	}
	return images;
};

export default search;
