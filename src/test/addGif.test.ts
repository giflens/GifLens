import * as assert from 'assert';
import * as vscode from 'vscode';

import {
	getLanguageCommentEnd,
	getLanguageCommentStart,
	addGifLensTagToEditor,
	// searchTask,
} from '../addGif';

suite('AddGif creates a GIFLENS tag', function() {
	test('given a correct language identifier, getLanguageCommentStart should return the correct comment start', function() {
		const commentStart = getLanguageCommentStart('c');
		assert(commentStart === '/*');
	});

	test('given a correct language identifier, getLanguageCommentEnd should return the correct comment end', function() {
		const commentEnd = getLanguageCommentEnd('css');
		assert(commentEnd === ' */');
	});

	test('given an editor and a non empty string, addGifLensTagToEditor correctly adds the GIFLENS tag', async function() {
		const doc = await vscode.workspace.openTextDocument({
			language: 'javascript',
		});
		const editor = await vscode.window.showTextDocument(doc);
		assert(vscode.window.activeTextEditor === editor);
		if (vscode.window.activeTextEditor) {
			assert(doc === vscode.window.activeTextEditor.document);
		}
		const editStatus = await addGifLensTagToEditor(
			vscode.window.activeTextEditor,
			'test'
		);
		assert(editStatus);
		if (editStatus) {
			assert(doc.lineAt(0).text === '// GIFLENS-test');
		}
	});
});
