// client/src/lib/api.js
import { ABS_BASE_URL } from '../config';

export const getProxyUrl = (path) => {
  return `http://100.81.193.52:3000/api/proxy?path=${encodeURIComponent(path)}`;
};

// ADD THIS EXPORTED FUNCTION
export async function fetchLibrary() {
  try {
    const response = await fetch(getProxyUrl('/api/libraries'));
    const data = await response.json();
    
    // Support different ABS API response formats
    const libraries = data.libraries || data;
    const libraryId = libraries[0]?.id;
    if (!libraryId) return [];

    const itemsResponse = await fetch(getProxyUrl(`/api/libraries/${libraryId}/items`));
    const itemsData = await itemsResponse.json();
    
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