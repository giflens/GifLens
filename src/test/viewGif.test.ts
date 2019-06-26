suite('gifVisualizer Class is correctly implemented', function() {
	test(
		'GIVEN a Gif and a editor, init SHOULD open a Webview panel and fill the properties of the instance'
	);
	test(
		'GIVEN a Gif and a editor, update SHOULD update a Webview panel and fill the properties of the instance'
	);
	test(
		'GIVEN GifVisualizer has a Webview panel that is disposed, reset SHOULD reset the instance properties'
	);
});

suite('viewWebViewHtml is correctly implemented', function() {
	test('GIVEN a string, viewWebviewHtml SHOULD return a correct html');
	test(
		'GIVEN a strin, createGifHtml SHOULD retun a correct html img tag as a string'
	);
});
