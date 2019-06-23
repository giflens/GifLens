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

export const viewGif: (gif: HistoryEntry | FavoritesEntry) => void = (
	gif: HistoryEntry | FavoritesEntry
) => {
	const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
		'gifView', // Identifies the type of the webview. Used internally
		`${gif.label}`, // Title of the panel displayed to the user
		vscode.ViewColumn.Beside // Editor column to show the new webview panel in.
	);
	panel.webview.html = viewWebViewHtml(createGifHtml(gif));
	return panel;
};
