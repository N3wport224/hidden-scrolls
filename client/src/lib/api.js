export const getProxyUrl = (path) => {
  return `/api/proxy?path=${encodeURIComponent(path)}`;
};

export const fetchBookDetails = async (id) => {
  const url = getProxyUrl(`/api/items/${id}`);
  const response = await fetch(url);
  return response.json();
};

// Now accepts libraryId as a parameter
export const fetchLibrary = async (libraryId) => {
  const booksUrl = getProxyUrl(`/api/libraries/${libraryId}/items`);
  const response = await fetch(booksUrl);
  const data = await response.json();
  return data.results || [];
};