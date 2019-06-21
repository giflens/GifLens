import * as vscode from 'vscode';
import { HistoryEntry, HistoryProvider } from './history';

export const deleteGifFromHistory: (
	gif: HistoryEntry,
	context: vscode.ExtensionContext,
	historyTreeView: HistoryProvider
) => void = (
	gif: HistoryEntry,
	context: vscode.ExtensionContext,
	historyTreeView: HistoryProvider
) => {
	const history: HistoryEntry[] | undefined = context.globalState.get(
		'history'
	);
	if (history) {
		const updatedHistory: HistoryEntry[] = history.filter(
			entry => entry.gifUri !== gif.gifUri
		);
		context.globalState.update('history', updatedHistory).then(() => {
			historyTreeView.refresh(context.globalState);
		});
	} else {
		throw new Error('could not find history in global state to delete entry');
	}
};
