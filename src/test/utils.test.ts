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
});
