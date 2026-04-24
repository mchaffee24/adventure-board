export async function fetchAdventures() {
  const response = await fetch("./data/adventures.json");

  if (!response.ok) {
    throw new Error(`Adventure data failed to load: ${response.status}`);
  }

  return response.json();
}
