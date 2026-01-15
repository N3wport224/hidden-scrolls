import { ABS_BASE_URL } from '../config';

export const getProxyUrl = (path) => {
  // Directs requests through your Node.js server (Port 3000)
  return `http://100.81.193.52:3000/api/proxy?path=${encodeURIComponent(path)}`;
};

export async function fetchLibrary() {
  try {
    const response = await fetch(getProxyUrl('/api/libraries'));
    const data = await response.json();
    
    // Audiobookshelf can return libraries as an array or a nested object
    const libraries = data.libraries || data;
    const libraryId = libraries[0]?.id;
    
    if (!libraryId) return [];

    const itemsResponse = await fetch(getProxyUrl(`/api/libraries/${libraryId}/items`));
    const itemsData = await itemsResponse.json();
    
    return itemsData.results || [];
  } catch (error) {
    console.error("❌ Library Fetch Error:", error);
    return [];
  }
}

export async function fetchBookDetails(id) {
  const response = await fetch(getProxyUrl(`/api/items/${id}`));
  return await response.json();
}