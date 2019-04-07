const vscode = acquireVsCodeApi();
const searchImages = document.getElementsByClassName('search-img');

const sendUrl = event => {
	const url = event.target.getAttribute('src');
	vscode.postMessage({
		command: 'url',
		text: url,
	});
};
searchImages.addEventListener('click', sendUrl);
arr.forEach(gifItem => {gifItem.addEventListener('click', sendUrl)})