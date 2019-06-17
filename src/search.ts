import * as vscode from 'vscode';

import { searchGif, Gif } from './utils';
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
        const sendGif = event => {
					const url = event.target.getAttribute('src');
					const label = event.target.getAttribute('alt');
          vscode.postMessage({
            command: 'url',
            text: { url, label},
          });
        };
        
        // attaching the click listener to each image
        arr.forEach(gifItem => {gifItem.addEventListener('click', sendGif)})

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
) => Promise<boolean | undefined> = async (
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
) => Promise<boolean | undefined> = async (
	searchInput: string | undefined,
	editor: vscode.TextEditor,
	context: vscode.ExtensionContext,
	history: HistoryProvider
) => {
	if (searchInput) {
		try {
			// part about getting the data and creating the img html tags for the images.
			const searchResults: Gif[] = await searchGif(searchInput);
			// if the search did not return anything, send an information message to the user, and break
			if (searchResults.length === 0) {
				vscode.window.showInformationMessage(
					'Your search did not return any result'
				);
				return false;
			}

			// urlToUse is defined with a promise that will be resolved once a user clicks a GIF
			const urlToUse: Gif = await new Promise(resolve =>
				getChosenGifUrl(searchResults, resolve, searchInput, context, history)
			);

			return vscode.commands.executeCommand(
				'giflens.addGif',
				urlToUse.url,
				editor
			);
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
 * creates img html tags from a set of gif urls (disposed one after the other)
 * @param  {string[]} gifs an array of gif urls
 * @returns {string} html img tags as a string
 */
export const createImages: (gifs: Gif[]) => string = (gifs: Gif[]) => {
	return gifs
		.map(
			gif =>
				`<img class="search-img" style="cursor: pointer;" src="${
					gif.url
				}" alt="${gif.label}" />`
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
	searchResults: Gif[],
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
					const newEntry: HistoryEntry = new HistoryEntry(
						message.text.label,
						message.text.url
					);
					const nextHistory =
						// TODO: the 15 could be a setting
						prevHistory && prevHistory.length < 15
							? [newEntry].concat(prevHistory)
							: prevHistory
							? [newEntry].concat(prevHistory.slice(0, -1))
							: [newEntry];
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
	searchResults: Gif[],
	page?: number
) => vscode.WebviewPanel = (searchResults: Gif[], page = 1) => {
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
