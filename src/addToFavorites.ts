import * as vscode from 'vscode';
import { FavoritesEntry, FavoritesProvider } from './favorites';
import { HistoryEntry } from './history';

/**
 * deletes a gif from the history (all occurences)
 * @param  {HistoryEntry} gif the gif to add to the favorites
 * @param  {vscode.Memento} state the state holder in which to get the current favorites to modify them
 * @param  {FavoritesProvider} favoritesTreeView the favorites tree view that is linked to the favorites menu, that needs to be refreshed for the change to appear to the user
 */
export const addGifToFavorites: (
	gif: HistoryEntry,
	state: vscode.Memento,
	favoritesTreeView: FavoritesProvider
) => void = (
	gif: HistoryEntry,
	state: vscode.Memento,
	favoritesTreeView: FavoritesProvider
) => {
	const favorites: FavoritesEntry[] | undefined = state.get('favorites');
	if (favorites) {
		if (favorites.filter(entry => entry.gifUri === gif.gifUri).length !== 0) {
			vscode.window.showInformationMessage(
				'This GIF was already in your favorites'
			);
		} else {
			const newFav = new FavoritesEntry(gif.label, gif.gifUri);
			state.update('favorites', [newFav].concat(favorites)).then(() => {
				favoritesTreeView.refresh(state);
			});
		}
	} else {
		const newFav = new FavoritesEntry(gif.label, gif.gifUri);
		state.update('favorites', [newFav]).then(() => {
			favoritesTreeView.refresh(state);
		});
	}
};
