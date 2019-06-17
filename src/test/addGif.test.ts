import * as assert from 'assert';
// import * as vscode from 'vscode';

import {
	getLanguageCommentEnd,
	getLanguageCommentStart,
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
});
