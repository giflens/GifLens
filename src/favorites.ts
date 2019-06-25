import * as vscode from 'vscode';

export class FavoritesProvider
	implements vscode.TreeDataProvider<FavoritesEntry> {
	// the events to be able to refresh the views
	private _onDidChangeTreeData: vscode.EventEmitter<
		FavoritesEntry | undefined
	> = new vscode.EventEmitter<FavoritesEntry | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FavoritesEntry | undefined> = this
		._onDidChangeTreeData.event;
	private favorites: FavoritesEntry[] | undefined;

	constructor(globalState: vscode.Memento) {
		// created from the global state to be kept between sessions
		this.favorites = globalState.get('favorites');
	}

	refresh(globalState: vscode.Memento): void {
		// keeping the history consistent with the global state
		this.favorites = globalState.get('favorites');
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: FavoritesEntry): vscode.TreeItem {
		return element;
	}

	getChildren(element?: FavoritesEntry): Thenable<FavoritesEntry[]> {
		if (element) {
			// our tree has only one level
			return Promise.resolve([]);
		} else {
			// from the root, returns the history list
			return Promise.resolve(this.favorites || []);
		}
	}
}

export class FavoritesEntry extends vscode.TreeItem {
	constructor(public readonly label: string, public readonly gifUri: string) {
		super(label);
		// this command is the one when clicking the name, could be removed, or changed to viewing the gif?
		this.command = {
			command: 'giflens.viewGif',
			title: 'View Gif',
			arguments: [{ gifUri, label }],
		};
		// maybe useless as our provider has only one type of node (this one), but will help at scaling eventually
		this.contextValue = 'favoritesItem';
	}
}
