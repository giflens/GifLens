import * as assert from 'assert';

import { searchGif } from '../utils';

suite('Search Gifs', function() {
	test('search with a correct term', async function() {
		const results = await searchGif('kylian mbappe');
		assert(results.length > 0);
	});

	test('search with a stupid term returning no result', async function() {
		const results = await searchGif('asujettikiwikirikirou');
		assert(results.length === 0);
	});

	test('given a pageNumber > 1, searchGif should return different results', async function() {
		const results = await searchGif('kylian mbappe');
		const results2 = await searchGif('kylian mbappe', 2);
		assert(results2.length > 0);
		assert(!results2.find(el => el === results[0]));
	});
});
