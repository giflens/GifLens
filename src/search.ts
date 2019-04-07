import * as vscode from 'vscode';

const search = async () => {
	// The code you place here will be executed every time your command is executed
	let searchInput = await vscode.window.showInputBox({
		placeHolder: 'your gif search',
		prompt: 'Enter your search, and press Enter',
	});
	if (searchInput) {
		const panel = vscode.window.createWebviewPanel(
			'gifSearch', // Identifies the type of the webview. Used internally
			'Gif Results', // Title of the panel displayed to the user
			vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
			{} // Webview options. More on these later.
		);
		const searchResults: string[] = await fakeData();
		const images: string = createImages(searchResults);
		panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <body>
        ${images}
    </body>
    </html>`;
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
		images += `<img src="${url}" />`;
	}
	return images;
};

export default search;
