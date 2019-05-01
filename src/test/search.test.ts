import * as assert from 'assert';

import {
	createImages,
	getLanguageCommentEnd,
	getLanguageCommentStart,
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
		const commentStart = getLanguageCommentEnd('css');
		assert(commentStart === ' */');
	});
});
