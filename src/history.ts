import * as vscode from 'vscode';

export class HistoryProvider implements vscode.TreeDataProvider<HistoryEntry> {
	// the events to be able to refresh the views
	private _onDidChangeTreeData: vscode.EventEmitter<
		HistoryEntry | undefined
	> = new vscode.EventEmitter<HistoryEntry | undefined>();
	readonly onDidChangeTreeData: vscode.Event<HistoryEntry | undefined> = this
		._onDidChangeTreeData.event;
	private history: HistoryEntry[] | undefined;

	constructor(globalState: vscode.Memento) {
		// created from the global state to be kept between sessions
		this.history = globalState.get('history');
	}

	refresh(globalState: vscode.Memento): void {
		// keeping the history consistent with the global state
		this.history = globalState.get('history');
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: HistoryEntry): vscode.TreeItem {
		return element;
	}

	getChildren(element?: HistoryEntry): Thenable<HistoryEntry[]> {
		if (element) {
			// our tree has only one level
			return Promise.resolve([]);
		} else {
			// from the root, returns the history list
			return Promise.resolve(this.history ? this.history : []);
		}
	}
}

export class HistoryEntry extends vscode.TreeItem {
	constructor(public readonly label: string, public readonly gifUri: string) {
		super(label);
		// this command is the one when clicking the name, could be removed, or changed to viewing the gif?
		this.command = {
			command: 'giflens.viewGif',
			title: 'View Gif',
			arguments: [this],
		};
		// maybe useless as our provider has only one type of node (this one), but will help at scaling eventually
		this.contextValue = 'historyItem';
	}
}
