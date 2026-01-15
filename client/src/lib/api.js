import { ABS_BASE_URL } from '../config';

export const getProxyUrl = (path) => {
  // Directs requests through your Node.js server to handle headers
  return `http://100.81.193.52:3000/api/proxy?path=${encodeURIComponent(path)}`;
};

export async function fetchLibrary() {
  try {
    // 1. Get all libraries
    const response = await fetch(getProxyUrl('/api/libraries'));
    const data = await response.json();
    
    // 2. Target the first library (Audiobooks)
    const libraryId = data.libraries?.[0]?.id || data[0]?.id;
    if (!libraryId) return [];

    // 3. Fetch items for that library
    const itemsResponse = await fetch(getProxyUrl(`/api/libraries/${libraryId}/items`));
    const itemsData = await itemsResponse.json();
    
    // Return the array of books
    return itemsData.results || [];
  } catch (error) {
    console.error("Failed to fetch library:", error);
    return [];
  }
}

export async function fetchBookDetails(id) {
  const response = await fetch(getProxyUrl(`/api/items/${id}`));
  return await response.json();
}