import { API_BASE_URL } from '../config';

export async function fetchBooks() {
  try {
    // We added your specific Library ID here:
    const response = await fetch(`${API_BASE_URL}?path=/api/libraries/575767a4-d45d-466c-8295-8766aa060b44/items?mediaType=audiobook`);
    
    if (!response.ok) throw new Error('Failed to fetch books');
    return await response.json();
  } catch (error) {
    console.error(error);
    return { results: [] };
  }
}

export async function fetchBookDetails(id) {
  try {
    // For single books, the ID is usually enough, but we keep the structure consistent
    const response = await fetch(`${API_BASE_URL}?path=/api/items/${id}`);
    if (!response.ok) throw new Error('Failed to fetch book details');
    return await response.json();
  } catch (error) {
    console.error("Error fetching single book:", error);
    return null;
  }
}