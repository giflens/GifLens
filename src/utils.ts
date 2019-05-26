const axios = require('axios');

const GIPHY_API_KEY = 'VDTsjv7FD1PCrcZ5AtyhYMSPW2TREanK';

/**
 * Function to search a gif on Giphy.
 * @param searchTerms A string with the search terms the user typed.
 * @returns An array of fixed height (200px) gifs which will fit correctly in our Gif hover and preview popups.
 */
export const searchGif = async (
	searchTerms: string,
	pageNumber = 1
): Promise<string[]> => {
	const url = `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(
		searchTerms
	)}&api_key=${GIPHY_API_KEY}&offset=${(pageNumber - 1) * 20}`;

	const response = await axios.get(url);
	const data = response.data.data.map(
		(imageObject: any) => imageObject.images.fixed_height.url
	);

	return data;
};
