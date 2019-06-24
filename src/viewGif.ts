import * as vscode from 'vscode';
import { HistoryEntry } from './history';
import { FavoritesEntry } from './favorites';

const viewWebViewHtml: (imageHtml: string) => string = (
	imageHtml: string
) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Gif</title>
</head>
<body>
    <div><img src="https://giflens.org/assets/PoweredBy_200_Horizontal_Light-Backgrounds_With_Logo.gif" alt="powered by giphy"/></div>
    ${imageHtml}
</body>
</html>`;

const createGifHtml: (gif: HistoryEntry | FavoritesEntry) => string = (
	gif: HistoryEntry | FavoritesEntry
) => `<img class="search-img" src="${gif.gifUri}" alt="${gif.label}" />`;

export const viewGif: (
	gif: HistoryEntry | FavoritesEntry,
	workspaceState: vscode.Memento
) => void = (
	gif: HistoryEntry | FavoritesEntry,
	workspaceState: vscode.Memento
) => {
	// getting a possible existing viewGif webview (to avoid creating multiple webviews)
	// workspaceState is reinitialized between sessions (different from globalState). It is also a Memento
	const existingPanel: vscode.WebviewPanel | undefined = workspaceState.get(
		'viewPanel'
	);
	if (existingPanel) {
		existingPanel.webview.html = viewWebViewHtml(createGifHtml(gif));
		existingPanel.title = gif.label;
	} else {
		const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
			'gifView', // Identifies the type of the webview. Used internally
			gif.label, // Title of the panel displayed to the user
			vscode.ViewColumn.Beside // Editor column to show the new webview panel in.
		);
		panel.webview.html = viewWebViewHtml(createGifHtml(gif));
		// when the panel is closed, the state is reinitialized
		panel.onDidDispose(() => {
			// using undefined to remove a key from a Memento
			workspaceState.update('viewPanel', undefined);
		});
		// placing the panel in the workspace state so that it is kept through the application for a later call
		workspaceState.update('viewPanel', panel);
	}

	return;
};
