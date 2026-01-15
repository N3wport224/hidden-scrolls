export const getProxyUrl = (path) => {
  return `http://100.81.193.52:3000/api/proxy?path=${encodeURIComponent(path)}`;
};

export async function fetchLibrary() {
  const response = await fetch(getProxyUrl('/api/libraries'));
  const data = await response.json();
  const libraries = data.libraries || data;
  const libId = libraries[0]?.id;
  if (!libId) return [];

  const itemsRes = await fetch(getProxyUrl(`/api/libraries/${libId}/items`));
  const itemsData = await itemsRes.json();
  return itemsData.results || [];
}

export async function fetchBookDetails(id) {
  // Only one declaration here now to fix the build crash
  const response = await fetch(getProxyUrl(`/api/items/${id}`));
  if (!response.ok) return null;
  return await response.json();
}