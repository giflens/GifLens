import * as vscode from 'vscode';

import { searchGif } from './utils';

export const webviewHtml: (imagesHtml: string) => string = (
	imagesHtml: string
) =>
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

const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GifLens down</title>
</head>
<body>
<img src="https://media.giphy.com/media/mq5y2jHRCAqMo/giphy.gif"
</body>
</html>`;

export const search = async (
	editor: vscode.TextEditor,
	context: vscode.ExtensionContext
) => {
	// The code you place here will be executed every time your command is executed
	const searchInput: string | undefined = await vscode.window.showInputBox({
		placeHolder: 'your gif search',
		prompt: 'Enter your search, and press Enter',
	});
	searchTask(searchInput, editor);
};

export const searchTask = async (
	searchInput: string | undefined,
	editor: vscode.TextEditor
) => {
	// grabbing the current location to insert the edit later with the GIFLENS tag
	const position: vscode.Position = editor.selection.active;
	if (searchInput) {
		try {
			// part about getting the data and creating the img html tags for the images.
			const searchResults: string[] = await searchGif(searchInput);
			// if the search did not return anything, send an information message to the user, and break
			if (searchResults.length === 0) {
				vscode.window.showInformationMessage(
					'Your search did not return any result'
				);
				return false;
			}

			// urlToUse is defined with a promise that will be resolved once a user clicks a GIF
			const urlToUse = await new Promise(resolve =>
				getChosenGifUrl(searchResults, resolve)
			);

			editor.edit(editBuilder => {
				// getting the position where to insert (beginning of the current line)
				let positionToInsert = new vscode.Position(position.line, 0);
				// first case when the selected line is empty, we do not create a new line
				if (editor.document.lineAt(position).isEmptyOrWhitespace) {
					editBuilder.insert(
						positionToInsert,
						`${getLanguageCommentStart(
							editor.document.languageId
						)} GIFLENS-${urlToUse}${getLanguageCommentEnd(
							editor.document.languageId
						)}`
						// \r is used to create a new line, VSCode converts automatically to the end of line of the current OS
					);
					// else second case when using it from a line of code, we insert a new line above
				} else {
					// getting the number of spaces or tabs at the beginning of the line
					const lineBeginningChars: number = editor.document.lineAt(position)
						.firstNonWhitespaceCharacterIndex;
					// goes to the beginning of the line to create the GIFLENS tag the line above after insertion
					editBuilder.insert(
						positionToInsert,
						`${
							// insertSpaces returns false if the user uses tabs, true if the user uses spaces
							// it is defined per document in VSCode, so if the user voluntarily changes it on one line, this code will not work
							editor.options.insertSpaces
								? // returns the correct indentation character for the user
								  ' '.repeat(lineBeginningChars)
								: '\t'.repeat(lineBeginningChars)
						}${getLanguageCommentStart(
							editor.document.languageId
						)} GIFLENS-${urlToUse}${getLanguageCommentEnd(
							editor.document.languageId
						)}\r`
						// \r is used to create a new line, VSCode converts automatically to the end of line of the current OS
					);
				}
			});
		} catch (err) {
			handleApiError(err);
		}
	}
	// if the user did not enter anything, send an info message
	else {
		vscode.window.showInformationMessage(
			'GifLens: You have to enter your GIF search'
		);
	}
};

export const createImages: (urls: string[]) => string = (urls: string[]) => {
	return urls.map(url => `<img class="search-img" src="${url}" />`).join('');
};

export const getChosenGifUrl: (
	searchResults: string[],
	resolve: Function
) => void = (searchResults, resolve) => {
	// creates a webview panel
	const panel: vscode.WebviewPanel = createGifSelectionPanel(searchResults);

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
};

/**
 * creates a Webview panel with the gifs to select from. It is generated from the gif search results
 * @param  {string[]} searchResults contains an array of url as strings (gif urls)
 * @returns {vscode.WebviewPanel} a vscode webview panel
 */
export const createGifSelectionPanel: (
	searchResults: string[]
) => vscode.WebviewPanel = searchResults => {
	const images: string = createImages(searchResults);
	const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
		'gifSearch', // Identifies the type of the webview. Used internally
		'Gif Results', // Title of the panel displayed to the user
		vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
		{
			enableScripts: true,
		} // Webview options. authorizes js
	);
	panel.webview.html = webviewHtml(images);
	return panel;
};

/**
 * The syntax to open a comment for a specific language.
 * @param languageId The languageId (handled by VS code).
 * @returns A String to open a comment.
 */
export const getLanguageCommentStart = (languageId: String) => {
	switch (languageId) {
		case 'bat':
			return 'REM';
		case 'clojure':
			return ';';
		case 'ruby':
		case 'coffeescript':
		case 'dockerfile':
		case 'makefile':
		case 'perl':
		case 'powershell':
		case 'python':
		case 'r':
		case 'shellscript':
		case 'yaml':
			return '#';
		case 'c':
		case 'css':
			return '/*';
		case 'html':
		case 'markdown':
			return '<!--';
		case 'lua':
		case 'sql':
			return '--';
		case 'swift':
			return '///';
		case 'vb':
			return "'";
		case 'javascript':
		case 'typescript':
		case 'cpp':
		case 'csharp':
		case 'fsharp':
		case 'go':
		case 'groovy':
		case 'java':
		case 'javascriptreact':
		case 'less':
		case 'objective-c':
		case 'objective-cpp':
		case 'php':
		case 'jade':
		case 'rust':
		case 'scss':
		case 'sass':
		case 'typescriptreact':
		default:
			return '//';
	}
};

/**
 * The (optional) closing comment syntax for the language.
 * All the results need to start with a space!
 * @param languageId The languageId (handled by VS code).
 * @returns A String, mepty for most cases.
 */
export const getLanguageCommentEnd = (languageId: String) => {
	switch (languageId) {
		case 'c':
		case 'css':
			return ' */';
		case 'html':
			return ' -->';
		default:
			return '';
	}
};

// function to handle API errors
export const handleApiError = (err: Error) => {
	// displaying an error message
	vscode.window.showErrorMessage(
		'GifLens: It seems GIFs are on a break at the moment'
	);

	// displaying a funny gif for the error
	const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
		'gifError', // Identifies the type of the webview. Used internally
		'GifLens Error', // Title of the panel displayed to the user
		vscode.ViewColumn.Beside // Editor column to show the new webview panel in.
	);

	panel.webview.html = errorHtml;
};

export default search;
