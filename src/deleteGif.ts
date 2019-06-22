import * as vscode from 'vscode';
import { HistoryEntry, HistoryProvider } from './history';
/**
 * deletes a gif from the history (all occurences)
 * @param  {HistoryEntry} gif the gif to delete from the history
 * @param  {vscode.Memento} state the state holder in which to get the current history to modify it
 * @param  {HistoryProvider} historyTreeView the history tree view that is linked to the history menu, that needs to be refreshed for the change to appear to the user
 */
export const deleteGifFromHistory: (
	gif: HistoryEntry,
	state: vscode.Memento,
	historyTreeView: HistoryProvider
) => void = (
	gif: HistoryEntry,
	state: vscode.Memento,
	historyTreeView: HistoryProvider
) => {
	const history: HistoryEntry[] | undefined = state.get('history');
	if (history) {
		const updatedHistory: HistoryEntry[] = history.filter(
			entry => entry.gifUri !== gif.gifUri
		);
		state.update('history', updatedHistory).then(() => {
			historyTreeView.refresh(state);
		});
	} else {
		throw new Error('could not find history in global state to delete entry');
	}
};
