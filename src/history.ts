import * as vscode from 'vscode';

export class HistoryProvider implements vscode.TreeDataProvider<HistoryEntry> {
	private _onDidChangeTreeData: vscode.EventEmitter<
		HistoryEntry | undefined
	> = new vscode.EventEmitter<HistoryEntry | undefined>();
	readonly onDidChangeTreeData: vscode.Event<HistoryEntry | undefined> = this
		._onDidChangeTreeData.event;
	private history: any[] | undefined;

	constructor(globalState: vscode.Memento) {
		this.history = globalState.get('history')
			? globalState.get('history')
			: undefined;
	}

	refresh(globalState: vscode.Memento): void {
		this.history = globalState.get('history')
			? globalState.get('history')
			: undefined;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: HistoryEntry): vscode.TreeItem {
		return element;
	}

	getChildren(element?: HistoryEntry): Thenable<HistoryEntry[]> {
		if (element) {
			return Promise.resolve([]);
		} else {
			return Promise.resolve(this.history ? this.history : []);
		}
	}
}

export class HistoryEntry extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly gifUri: string,
		public readonly command?: vscode.Command
	) {
		super(label);
	}

	get tooltip(): string {
		return `${this.gifUri}`;
	}

	get description(): string {
		return this.gifUri;
	}
}
