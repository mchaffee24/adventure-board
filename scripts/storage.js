const USER_KEY = "adventureBoardUser";
const ITINERARY_KEY = "adventureBoardItinerary";

export function getCurrentUser() {
  return sessionStorage.getItem(USER_KEY);
}

export function setCurrentUser(username) {
  sessionStorage.setItem(USER_KEY, username);
}

export function clearCurrentUser() {
  sessionStorage.removeItem(USER_KEY);
}

export function getItinerary() {
  const saved = sessionStorage.getItem(ITINERARY_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveItinerary(items) {
  sessionStorage.setItem(ITINERARY_KEY, JSON.stringify(items));
}

export function upsertItineraryItem(item) {
  const items = getItinerary();
  const existingIndex = items.findIndex((savedItem) => savedItem.id === item.id);

  if (existingIndex >= 0) {
    items.splice(existingIndex, 1, item);
  } else {
    items.push(item);
  }

  saveItinerary(items);
  return items;
}

export function removeItineraryItem(itemId) {
  const items = getItinerary().filter((item) => item.id !== itemId);
  saveItinerary(items);
  return items;
}

export function toggleItineraryItem(itemId) {
  const items = getItinerary().map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    return {
      ...item,
      complete: !item.complete
    };
  });

  saveItinerary(items);
  return items;
}
