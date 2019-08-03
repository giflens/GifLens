import * as vscode from 'vscode';
import { HistoryEntry } from './history';
import { FavoritesEntry } from './favorites';

export const viewWebViewHtml: (imageHtml: string) => string = (
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
    <script>
      // acquiring the vscode webview specific api to send messages to the extension
      const vscode = acquireVsCodeApi();

      // event handler that sends back to the extension the url of the clicked gif
      const sendGif = event => {
        const url = event.target.getAttribute('src');
        const label = event.target.getAttribute('alt');
        vscode.postMessage({
          command: 'url',
          text: { url, label},
        });
      };

      const gifItem = document.getElementById("gif");
      gifItem.addEventListener('click', sendGif);
    </script>
</body>
</html>`;

export const createGifHtml: (gif: HistoryEntry | FavoritesEntry) => string = (
	gif: HistoryEntry | FavoritesEntry
) =>
	`<img id="gif" style="cursor: pointer;" src="${gif.gifUri}" alt="${
		gif.label
	}" />`;

export enum GifVisualizerState {
	Idle,
	Active,
}

export class GifVisualizer {
	// to conserve the current panel
	panel?: vscode.WebviewPanel;
	// the gif currently displayed
	gif?: HistoryEntry | FavoritesEntry;
	// the listener to webview messages
	messageReceptionListener?: vscode.Disposable;
	// the state of the visualizer
	state: GifVisualizerState;
	// the editor to which apply the GIFLENS tag when the image is clicked
	editor?: vscode.TextEditor;

	constructor() {
		this.state = GifVisualizerState.Idle;
	}

	/**
	 * Initialize a new Viewing session with the Gif to view
	 * @param  {HistoryEntry|FavoritesEntry} gif
	 */
	init(
		gif: HistoryEntry | FavoritesEntry,
		editor: vscode.TextEditor | undefined
	) {
		if (editor) {
			this.editor = editor;
		} else {
			vscode.window.showInformationMessage(
				'You have no active editor, you wont be able to click-insert the Gif'
			);
		}

		this.panel = vscode.window.createWebviewPanel(
			'gifView', // Identifies the type of the webview. Used internally
			gif.label, // Title of the panel displayed to the user
			vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
			{
				enableScripts: true,
			}
		);
		this.panel.webview.html = viewWebViewHtml(createGifHtml(gif));

		// creating a Listener
		this.messageReceptionListener = this.attachListener(
			this.panel,
			this.editor
		);

		// when the panel is closed, the state is reinitialized
		this.panel.onDidDispose(() => {
			// using undefined to remove a key from a Memento
			this.reset();
		});

		this.state = GifVisualizerState.Active;
	}

	/**
	 * During a Viewing session, update the Gif to view
	 * @param  {HistoryEntry|FavoritesEntry} gif
	 */
	updateGif(
		gif: HistoryEntry | FavoritesEntry,
		editor: vscode.TextEditor | undefined
	) {
		if (this.panel && this.messageReceptionListener) {
			this.panel.webview.html = viewWebViewHtml(createGifHtml(gif));
			this.panel.title = gif.label;
			this.messageReceptionListener.dispose();
			if (editor) {
				this.editor = editor;
			}
			this.messageReceptionListener = this.attachListener(
				this.panel,
				this.editor
			);
		} else {
			throw new Error('There is no current panel');
		}
	}

	/**
	 * Terminate the Gif View Session (called on Dispose)
	 */
	reset() {
		this.panel = undefined;
		this.gif = undefined;
		this.messageReceptionListener = undefined;
		this.state = GifVisualizerState.Idle;
	}

	/**
	 * For now, it does not point directly to the instance elements,
	 * as part of the undefined mgt is done in the other methods
	 * @param  {vscode.WebviewPanel} panel
	 * @param  {vscode.TextEditor|undefined} editor
	 * @returns  {vscode.Disposable} Listener disposable, useful to get rid of it on updates
	 */
	attachListener(
		panel: vscode.WebviewPanel,
		editor: vscode.TextEditor | undefined
	) {
		// when the image is clicked, create a GIFLENS tag and close the webview
		// returns the disposable
		return panel.webview.onDidReceiveMessage(message => {
			panel.dispose();
			this.reset();
			if (editor) {
				vscode.commands.executeCommand(
					'giflens.addGif',
					message.text.url,
					editor
				);
			} else {
				vscode.window.showInformationMessage(
					'As you had no active editor, you are not able to click-insert this Gif'
				);
			}
		});
	}
}
