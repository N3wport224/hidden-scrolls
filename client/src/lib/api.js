export const getProxyUrl = (path) => {
  return `http://100.81.193.52:3000/api/proxy?path=${encodeURIComponent(path)}`;
};

// NEW: Debugger tool to verify backend health
export async function testABSConnection() {
  try {
    const res = await fetch(getProxyUrl('/api/libraries'));
    return { ok: res.ok, status: res.status, msg: res.ok ? "Connected" : "Token/Server Error" };
  } catch (err) {
    return { ok: false, msg: "Cannot reach Pi Server" };
  }
}

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

// FIXED: Removed duplicate declaration to resolve build failure
export async function fetchBookDetails(id) {
  const response = await fetch(getProxyUrl(`/api/items/${id}`));
  if (!response.ok) return null;
  return await response.json();
}