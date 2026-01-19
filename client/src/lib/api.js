export const getProxyUrl = (path) => {
  return `/api/proxy?path=${encodeURIComponent(path)}`;
};

export const fetchBookDetails = async (id) => {
  const url = getProxyUrl(`/api/items/${id}`);
  const response = await fetch(url);
  return response.json();
};

// Fetch books for a specific Library ID
export const fetchLibrary = async (libraryId) => {
  const booksUrl = getProxyUrl(`/api/libraries/${libraryId}/items`);
  const response = await fetch(booksUrl);
  
  if (!response.ok) throw new Error("Library not found");
  
  const data = await response.json();
  return data.results || [];
};