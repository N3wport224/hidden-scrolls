import { API_BASE_URL } from '../config';

// 1. Fetch the list of books
export async function fetchBooks() {
  try {
    // YOUR LIBRARY ID IS HERE:
    const response = await fetch(`${API_BASE_URL}?path=/api/libraries/575767a4-d45d-466c-8295-8766aa060b44/items?mediaType=audiobook`);
    if (!response.ok) throw new Error('Failed to fetch books');
    return await response.json();
  } catch (error) {
    console.error(error);
    return { results: [] };
  }
}

// 2. Fetch details for one book
export async function fetchBookDetails(id) {
  try {
    const response = await fetch(`${API_BASE_URL}?path=/api/items/${id}`);
    if (!response.ok) throw new Error('Failed to fetch book details');
    return await response.json();
  } catch (error) {
    console.error("Error fetching single book:", error);
    return null;
  }
}

// 3. NEW: Generate the correct URL for Covers and Audio
export function getProxyUrl(targetPath) {
  // This forces images/audio to go through our server
  return `${API_BASE_URL}?path=${encodeURIComponent(targetPath)}`;
}