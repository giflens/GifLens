import * as assert from 'assert';
import * as vscode from 'vscode';

import {
	createImages,
	getLanguageCommentEnd,
	getLanguageCommentStart,
	searchTask,
} from '../search';

suite('Search Webview', function() {
	test('given a string array, createImages should return <img> html tags as one string', function() {
		const createdString = createImages(['1', '2', '3']);
		assert(
			createdString ===
				'<img class="search-img" src="1" /><img class="search-img" src="2" /><img class="search-img" src="3" />'
		);
	});

	test('given a correct language identifier, getLanguageCommentStart should return the correct comment start', function() {
		const commentStart = getLanguageCommentStart('c');
		assert(commentStart === '/*');
	});

	test('given a correct language identifier, getLanguageCommentEnd should return the correct comment end', function() {
		const commentEnd = getLanguageCommentEnd('css');
		assert(commentEnd === ' */');
	});

	test('given the user did not enter any search term, searchTask should return false', async function() {
		// opens a new unnamed document and show it to have a textEditor to work with
		const newEditor: vscode.TextEditor = await vscode.workspace
			.openTextDocument({ content: 'for running tests' })
			.then(document => {
				return vscode.window.showTextDocument(document);
			});

		const status = await searchTask(undefined, newEditor);
		assert(status === false);
	});

	test('[NOT IMPLEMENTED] given the user enters a correct term, searchTask should return true once the user picks an image in the webview', function() {
		assert(true);
	});
});
