const API_BASE = 'http://localhost:3000/api/proxy';

// --- MAIN LIBRARY FETCH (Your existing robust logic) ---
export async function fetchBooks() {
  try {
    console.log("🔍 DIAGNOSTIC: Attempting to connect...");

    // 1. Try the "Global" endpoint first (The Simple Way)
    console.log("1. Trying Global /api/items...");
    const globalRes = await fetch(`${API_BASE}?path=/api/items?mediaType=audiobook`);
    if (globalRes.ok) {
        console.log("✅ Global endpoint worked!");
        return await globalRes.json();
    }
    console.log(`❌ Global endpoint failed (Status: ${globalRes.status})`);

    // 2. If that fails, try the "Library" endpoint (The Smart Way)
    console.log("2. Trying Library Discovery /api/libraries...");
    const libRes = await fetch(`${API_BASE}?path=/api/libraries`);
    
    if (!libRes.ok) {
        console.error("❌ Failed to list libraries!");
        return { results: [] };
    }

    const libData = await libRes.json();
    const libraries = libData.libraries || [];
    console.log("📚 Found Libraries:", libraries);

    if (libraries.length === 0) {
        console.warn("⚠️ Server returned 0 libraries.");
        return { results: [] };
    }

    // 3. Pick the first library and get its books
    const firstLib = libraries[0];
    console.log(`3. Fetching books from Library: ${firstLib.name} (ID: ${firstLib.id})`);
    
    const booksRes = await fetch(`${API_BASE}?path=/api/libraries/${firstLib.id}/items?mediaType=audiobook`);
    if (!booksRes.ok) {
        console.error("❌ Failed to fetch items from library.");
        return { results: [] };
    }

    const booksData = await booksRes.json();
    console.log("✅ Books Data Received:", booksData);
    return booksData;

  } catch (error) {
    console.error("💀 FATAL ERROR:", error);
    return { results: [] };
  }
}

// --- NEW FUNCTION: FETCH SINGLE BOOK DETAILS ---
export async function fetchBookDetails(id) {
  try {
    console.log(`🔍 Fetching details for book ID: ${id}`);
    
    // We ask for the specific item by its ID
    const response = await fetch(`${API_BASE}?path=/api/items/${id}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch book details (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log("✅ Single Book details received:", data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching single book details:", error);
    return null;
  }
}