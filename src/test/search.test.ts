import * as assert from 'assert';
import * as vscode from 'vscode';

import {
	createImages,
	searchTask,
	// searchTask,
} from '../search';
import { HistoryProvider } from '../history';

suite('Search Webview', function() {
	test('given a string array, createImages should return <img> html tags as one string', function() {
		const createdString = createImages([
			{ url: '1', label: '4' },
			{ url: '2', label: '5' },
			{ url: '3', label: '6' },
		]);
		assert(
			createdString ===
				'<img class="search-img" style="cursor: pointer;" src="1" alt="4" /><img class="search-img" style="cursor: pointer;" src="2" alt="5" /><img class="search-img" style="cursor: pointer;" src="3" alt="6" />'
		);
	});

	test('given the user did not enter any search term, searchTask should return false', async function() {
		// opens a new unnamed document and show it to have a textEditor to work with
		const newEditor: vscode.TextEditor = await vscode.workspace
			.openTextDocument({ content: 'for running tests' })
			.then(document => {
				return vscode.window.showTextDocument(document);
			});

		const giflens = vscode.extensions.getExtension('giflens.giflens');
		if (giflens) {
			const tempHistory = new HistoryProvider(giflens.exports.state);

			const status = await searchTask(
				undefined,
				newEditor,
				giflens.exports.state,
				tempHistory
			);
			assert(status === false);
		} else {
			assert(false);
		}
	});

	test('[NOT IMPLEMENTED] given the user enters a correct term, searchTask should return true once the user picks an image in the webview', function() {
		assert(true);
	});
});
