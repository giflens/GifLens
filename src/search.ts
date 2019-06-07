import * as vscode from 'vscode';

import { searchGif } from './utils';
import { HistoryProvider, HistoryEntry } from './history';

/**
 * creates the html for the webview (boilerplate + img tags from the gif search)
 * @param  {string} imagesHtml a string that contains html <img> tags for each gif
 * @returns {string} a string containing an html document to pass to the webview panel
 */
export const webviewHtml: (
	imagesHtml: string,
	page?: number,
	hasLoadMore?: boolean
) => string = (imagesHtml: string, page = 1, hasLoadMore = false) => {
	const buttonHtml = `<div style="width: 100%; background-color: #6157ff; font-size: 1.5em; text-align: center; color: white; font-weight: 800; cursor: pointer; padding-top: 10px; padding-bottom: 10px;" id="loadMore" data-page="${page}">Load More</div>`;

	return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Search Gif</title>
    </head>
    <body>
        <div><img src="https://giflens.org/assets/PoweredBy_200_Horizontal_Light-Backgrounds_With_Logo.gif" alt="powered by giphy"/></div>
        ${imagesHtml}
        ${hasLoadMore ? buttonHtml : ''}
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

        // creating the load more action
        const loadMoreButton = document.getElementById('loadMore');
        const askForMore = event => {
          const currentPage = event.target.getAttribute('data-page');
          vscode.postMessage({
            command: 'load-more',
            text: parseInt(currentPage)
          })
        }
        loadMoreButton.addEventListener('click', askForMore);
        
        </script>
    </body>
    </html>`;
};

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

/**
 * handler for the search TextEditorCommand
 * @param  {vscode.TextEditor} editor the active vsCode editor at the time the command is run
 * @param  {vscode.ExtensionContext} context the context of the extension
 * TODO: use the context to be able to store the failure gif inside the extension, rather than fetching it on the internet
 * @returns a Promise to a boolean, indicating the final status
 */
export const search: (
	editor: vscode.TextEditor,
	context: vscode.ExtensionContext,
	history: HistoryProvider
) => Promise<boolean> = async (
	editor: vscode.TextEditor,
	context: vscode.ExtensionContext,
	history
) => {
	// The code you place here will be executed every time your command is executed
	const searchInput: string | undefined = await vscode.window.showInputBox({
		placeHolder: 'your gif search',
		prompt: 'Enter your search, and press Enter',
	});
	const status = await searchTask(searchInput, editor, context, history);
	return status;
};

/**
 * handle the gif search, selection and edition of the editor (controller)
 * @param  {string|undefined} searchInput the string entered by the user to launch the gif search
 * @param  {vscode.TextEditor} editor the current active editor
 * @returns {Promise<boolean>} the status of the tast, true for completed, false for failure
 */
export const searchTask: (
	searchInput: string | undefined,
	editor: vscode.TextEditor,
	context: vscode.ExtensionContext,
	history: HistoryProvider
) => Promise<boolean> = async (
	searchInput: string | undefined,
	editor: vscode.TextEditor,
	context: vscode.ExtensionContext,
	history: HistoryProvider
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
			const urlToUse: string = await new Promise(resolve =>
				getChosenGifUrl(searchResults, resolve, searchInput, context, history)
			);

			return addGifLensTagToEditor(editor, position, urlToUse);
		} catch (err) {
			// if an error is returned from the search, calls the handleAPIError function
			return handleApiError(err);
		}
	}
	// if the user did not enter anything, send an info message
	else {
		vscode.window.showInformationMessage(
			'GifLens: You have to enter your GIF search'
		);
		return false;
	}
};

/**
 * add a giflens tag with the specified url in the active editor
 * @param  {vscode.TextEditor} editor the active vscode editor
 * @param  {vscode.Position} position the position of the cursor in the active vscode editor
 * @param  {string} url the url of the gif for which to insert a GifLens Tag
 * @returns {Thenable<boolean} a final status of the insertion
 */
const addGifLensTagToEditor: (
	editor: vscode.TextEditor,
	position: vscode.Position,
	url: string
) => Thenable<boolean> = (editor, position, urlToUse) => {
	return editor.edit(editBuilder => {
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
};

/**
 * creates img html tags from a set of gif urls (disposed one after the other)
 * @param  {string[]} urls an array of gif urls
 * @returns {string} html img tags as a string
 */
export const createImages: (urls: string[]) => string = (urls: string[]) => {
	return urls
		.map(
			url => `<img class="search-img" style="cursor: pointer;" src="${url}" />`
		)
		.join('');
};

/**
 * a Promise resolver function
 * uses search results as an array of url strings, creates a webview from it, and resolves on the url of the selected gif
 * @param  {string[]} searchResults
 * @param  {Function} resolve
 */
export const getChosenGifUrl: (
	searchResults: string[],
	resolve: Function,
	searchTerm: string,
	context: vscode.ExtensionContext,
	history: HistoryProvider
) => void = (searchResults, resolve, searchTerm, context, history) => {
	// creates a webview panel
	const panel: vscode.WebviewPanel = createGifSelectionPanel(searchResults);

	// create a listener to the webview to catch when the user clicks the image he has selected
	const subscription: vscode.Disposable = panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				case 'url':
					// resolve the promise to the url of the picture
					resolve(message.text);
					// update the global state with the new Search
					const prevHistory:
						| HistoryEntry[]
						| undefined = context.globalState.get('history');
					let nextHistory: HistoryEntry[] = [];
					if (prevHistory) {
						const newEntry: HistoryEntry = new HistoryEntry(
							message.text,
							message.text
						);
						nextHistory = prevHistory.concat([newEntry]);
					}
					context.globalState.update('history', nextHistory).then(() => {
						history.refresh(context.globalState);
					});
					// dispose of the subscription to the webview messages
					subscription.dispose();
					// dispose of the webview
					panel.dispose();
					break;
				case 'load-more':
					// get the current page number
					const currentPage = message.text;
					const nextResults = await searchGif(searchTerm, currentPage + 1);
					panel.webview.html =
						nextResults.length < 10
							? webviewHtml(createImages(nextResults))
							: webviewHtml(createImages(nextResults), currentPage + 1, true);
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
	searchResults: string[],
	page?: number
) => vscode.WebviewPanel = (searchResults: string[], page = 1) => {
	const images: string = createImages(searchResults);
	const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
		'gifSearch', // Identifies the type of the webview. Used internally
		'Gif Results', // Title of the panel displayed to the user
		vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
		{
			enableScripts: true,
		} // Webview options. authorizes js
	);
	panel.webview.html =
		searchResults.length < 10
			? webviewHtml(images)
			: webviewHtml(images, page, true);
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
		case 'markdown':
			return ' -->';
		default:
			return '';
	}
};

/**
 * to handle API errors with style 😎
 * @param  {Error} err an error returned by the API library
 * @returns {boolean} always returns false to indicate the search did not go thru
 */
export const handleApiError: (err: Error) => boolean = (err: Error) => {
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

	return false;
};

export default search;
