// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import searchHandler from './search';
import { HistoryProvider, HistoryEntry } from './history';
import { addGifLensTagToEditor } from './addGif';
import { deleteGifFromHistory } from './deleteGif';
import { FavoritesProvider, FavoritesEntry } from './favorites';
import { addGifToFavorites } from './addToFavorites';
import { removeGifFromFavorites } from './removeFromFavorites';
import { viewGif } from './viewGif';

const giflensRegexp = /GIFLENS-((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

// COPY HERE

// https://github.com/Microsoft/vscode-go/blob/86605f89ca43c865f511afb1d464a35eb8c8733e/src/goDeclaration.ts#L70-L82

// this is the function to provide the GIF hover on GIFLENS tags
vscode.languages.registerHoverProvider('*', {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.Hover | null {
		const range = document.getWordRangeAtPosition(position, giflensRegexp);

		if (range) {
			const url = document.getText(
				range.with(
					new vscode.Position(range.start.line, range.start.character + 8)
				)
			);
			return new vscode.Hover(`![GIF](${url})`);
		} else {
			return null;
		}
	},
});

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "giflens" is now active!');

	// instantiate a history provider and a favorites provider from the global state (extension permanent storage, works like a simple key value system)
	const historyTreeView = new HistoryProvider(context.globalState);
	const favoritesTreeView = new FavoritesProvider(context.globalState);

	// register the search command
	const searchDisposable: vscode.Disposable = vscode.commands.registerTextEditorCommand(
		'giflens.search',
		(textEditor: vscode.TextEditor) => {
			searchHandler(textEditor, context.globalState, historyTreeView);
		}
	);

	// register the add a GIFLENS tag command
	const addGifDisposable: vscode.Disposable = vscode.commands.registerCommand(
		'giflens.addGif',
		(
			gifUri: HistoryEntry | FavoritesEntry | string,
			editor?: vscode.TextEditor
		) => {
			if (editor) {
				addGifLensTagToEditor(
					editor,
					typeof gifUri === 'string' ? gifUri : gifUri.gifUri
				);
			} else if (vscode.window.activeTextEditor) {
				addGifLensTagToEditor(
					vscode.window.activeTextEditor,
					typeof gifUri === 'string' ? gifUri : gifUri.gifUri
				);
			} else {
				throw new Error('no active text editor');
			}
		}
	);

	// register the delete a Gif from history command
	const deleteHistoryGifDisposable: vscode.Disposable = vscode.commands.registerCommand(
		'giflens.deleteGif',
		(gif: HistoryEntry) => {
			deleteGifFromHistory(gif, context.globalState, historyTreeView);
		}
	);

	// register the reset history command
	const resetHistoryDisposable: vscode.Disposable = vscode.commands.registerCommand(
		'giflens.resetHistory',
		() => {
			// there is no delete interface on global state, undefined is passed to remove a key
			context.globalState.update('history', undefined).then(() => {
				historyTreeView.refresh(context.globalState);
			});
		}
	);

	// register the add to Favorites command
	const addToFavoritesDisposable: vscode.Disposable = vscode.commands.registerCommand(
		'giflens.addToFavorites',
		(gif: HistoryEntry) => {
			addGifToFavorites(gif, context.globalState, favoritesTreeView);
		}
	);

	// register the remove from Favorites command
	const removeFromFavoritesDisposable: vscode.Disposable = vscode.commands.registerCommand(
		'giflens.removeFromFavorites',
		(gif: FavoritesEntry) => {
			removeGifFromFavorites(gif, context.globalState, favoritesTreeView);
		}
	);

	// register the view Gif command
	const viewGifDisposable: vscode.Disposable = vscode.commands.registerCommand(
		'giflens.viewGif',
		(gif: HistoryEntry | FavoritesEntry) => {
			viewGif(gif);
		}
	);

	// register the tree provider for history
	const historyTreeViewDisposable = vscode.window.registerTreeDataProvider(
		'history',
		historyTreeView
	);

	// register the tree provider for favorites
	const favoritesTreeViewDisposable = vscode.window.registerTreeDataProvider(
		'favorites',
		favoritesTreeView
	);

	context.subscriptions.push(
		searchDisposable,
		historyTreeViewDisposable,
		addGifDisposable,
		deleteHistoryGifDisposable,
		resetHistoryDisposable,
		favoritesTreeViewDisposable,
		addToFavoritesDisposable,
		removeFromFavoritesDisposable,
		viewGifDisposable
	);

	let api = { state: context.globalState };
	return api;
}

// this method is called when your extension is deactivated
export function deactivate() {}
