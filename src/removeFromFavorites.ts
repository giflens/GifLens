import * as vscode from 'vscode';
import { FavoritesEntry, FavoritesProvider } from './favorites';

/**
 * removes a gif from the favorites (all occurences)
 * @param  {FavoritesEntry} gif the gif to remove from the favorites
 * @param  {vscode.Memento} state the state holder in which to get the current favorites to modify them
 * @param  {FavoritesProvider} favoritesTreeView the favorites tree view that is linked to the favorites menu, that needs to be refreshed for the change to appear to the user
 */
export const removeGifFromFavorites: (
	gif: FavoritesEntry,
	state: vscode.Memento,
	favoritesTreeView: FavoritesProvider
) => void = (
	gif: FavoritesEntry,
	state: vscode.Memento,
	favoritesTreeView: FavoritesProvider
) => {
	const favorites: FavoritesEntry[] | undefined = state.get('favorites');
	if (favorites) {
		const updatedFavorites = favorites.filter(
			entry => entry.gifUri !== gif.gifUri
		);
		if (updatedFavorites.length < favorites.length) {
			state.update('favorites', updatedFavorites).then(() => {
				favoritesTreeView.refresh(state);
			});
		} else {
			throw new Error(
				'remove from Favorites has been called from a Gif not present in the favorites'
			);
		}
	} else {
		throw new Error(
			'remove from Favorites has been called while no favorite existed'
		);
	}
};
