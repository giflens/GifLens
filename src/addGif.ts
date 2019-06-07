import * as vscode from 'vscode';

/**
 * add a giflens tag with the specified url in the active editor
 * @param  {vscode.TextEditor} editor the active vscode editor
 * @param  {string} url the url of the gif for which to insert a GifLens Tag
 * @returns {Thenable<boolean} a final status of the insertion
 */
export const addGifLensTagToEditor: (
	editor: vscode.TextEditor,
	url: string
) => Thenable<boolean> = (editor, urlToUse) => {
	return editor.edit(editBuilder => {
		// getting the position where to insert (beginning of the current line)
		let positionToInsert = new vscode.Position(editor.selection.active.line, 0);
		// first case when the selected line is empty, we do not create a new line
		if (editor.document.lineAt(editor.selection.active).isEmptyOrWhitespace) {
			editBuilder.insert(
				positionToInsert,
				`${getLanguageCommentStart(
					editor.document.languageId
				)} GIFLENS-${urlToUse}${getLanguageCommentEnd(
					editor.document.languageId
				)}`
				// \r is used to create a new line, VSCode converts automatically to the end of line of the current OS
			);
			// else second case when using it from a line of code, we insert a new line above
		} else {
			// getting the number of spaces or tabs at the beginning of the line
			const lineBeginningChars: number = editor.document.lineAt(
				editor.selection.active
			).firstNonWhitespaceCharacterIndex;
			// goes to the beginning of the line to create the GIFLENS tag the line above after insertion
			editBuilder.insert(
				positionToInsert,
				`${
					// insertSpaces returns false if the user uses tabs, true if the user uses spaces
					// it is defined per document in VSCode, so if the user voluntarily changes it on one line, this code will not work
					editor.options.insertSpaces
						? // returns the correct indentation character for the user
						  ' '.repeat(lineBeginningChars)
						: '\t'.repeat(lineBeginningChars)
				}${getLanguageCommentStart(
					editor.document.languageId
				)} GIFLENS-${urlToUse}${getLanguageCommentEnd(
					editor.document.languageId
				)}\r`
				// \r is used to create a new line, VSCode converts automatically to the end of line of the current OS
			);
		}
	});
};

/**
 * The syntax to open a comment for a specific language.
 * @param languageId The languageId (handled by VS code).
 * @returns A String to open a comment.
 */
export const getLanguageCommentStart = (languageId: String) => {
	switch (languageId) {
		case 'bat':
			return 'REM';
		case 'clojure':
			return ';';
		case 'ruby':
		case 'coffeescript':
		case 'dockerfile':
		case 'makefile':
		case 'perl':
		case 'powershell':
		case 'python':
		case 'r':
		case 'shellscript':
		case 'yaml':
			return '#';
		case 'c':
		case 'css':
			return '/*';
		case 'html':
		case 'markdown':
			return '<!--';
		case 'lua':
		case 'sql':
			return '--';
		case 'swift':
			return '///';
		case 'vb':
			return "'";
		case 'javascript':
		case 'typescript':
		case 'cpp':
		case 'csharp':
		case 'fsharp':
		case 'go':
		case 'groovy':
		case 'java':
		case 'javascriptreact':
		case 'less':
		case 'objective-c':
		case 'objective-cpp':
		case 'php':
		case 'jade':
		case 'rust':
		case 'scss':
		case 'sass':
		case 'typescriptreact':
		default:
			return '//';
	}
};

/**
 * The (optional) closing comment syntax for the language.
 * All the results need to start with a space!
 * @param languageId The languageId (handled by VS code).
 * @returns A String, mepty for most cases.
 */
export const getLanguageCommentEnd = (languageId: String) => {
	switch (languageId) {
		case 'c':
		case 'css':
			return ' */';
		case 'html':
		case 'markdown':
			return ' -->';
		default:
			return '';
	}
};
