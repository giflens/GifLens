import * as vscode from 'vscode';
import { HistoryEntry, HistoryProvider } from './history';

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
