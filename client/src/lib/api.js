import { API_BASE_URL } from '../config'; // Import the new relative path

export async function fetchBooks() {
  try {
    // Use the variable from config.js instead of a hardcoded string
    const response = await fetch(`${API_BASE_URL}?path=/api/items?mediaType=audiobook`);
    if (!response.ok) throw new Error('Failed to fetch books');
    return await response.json();
  } catch (error) {
    console.error(error);
    return { results: [] };
  }
}

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