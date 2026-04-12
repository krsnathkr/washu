import { useLists, WATCHLIST_ID } from "./lists";

export function useWatchlist() {
  const listsStore = useLists();
  const watchlist = listsStore.lists.find((list) => list.id === WATCHLIST_ID);

  return {
    entries: watchlist?.entries ?? [],
    add: (symbol: string, name = symbol) => listsStore.addToList(WATCHLIST_ID, symbol, name),
    remove: (symbol: string) => listsStore.removeFromList(WATCHLIST_ID, symbol),
    has: (symbol: string) => listsStore.isInList(WATCHLIST_ID, symbol),
  };
}
