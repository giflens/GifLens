suite('ViewGif Command is correctly implemented', function() {
	test(
		'GIVEN a Favorite or History Entry, viewGif SHOULD open a Webview with the Gif displayed inside'
	);
	test(
		'GIVEN the webiew is created, clicking on the image SHOULD add it to the active editor'
	);
	test(
		'GIVEN a GIF is currently displayed in a webview, WHEN the user cliks on another Gif, viewGif SHOULD modify the current webview and not create a new one'
	);
});

suite('viewWebViewHtml is correctly implemented', function() {
	test('GIVEN a string, viewWebviewHtml SHOULD return a correct html');
	test(
		'GIVEN a strin, createGifHtml SHOULD retun a correct html img tag as a string'
	);
});
