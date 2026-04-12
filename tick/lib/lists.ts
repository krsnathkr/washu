import { useSyncExternalStore } from "react";
import type { SavedStockEntry, UserList } from "./types";

export const LISTS_STORAGE_KEY = "tick:lists";
export const LEGACY_WATCHLIST_STORAGE_KEY = "tick:watchlist";
export const LISTS_UPDATED_EVENT = "tick:lists:updated";
export const WATCHLIST_ID = "watchlist";
export const WATCHLIST_NAME = "Watchlist";
export const WATCHLIST_EMOJI = "⭐";

const FALLBACK_LIST_NAME = "New List";
const FALLBACK_CUSTOM_LIST_EMOJI = "📋";

export const LIST_EMOJI_OPTIONS = [
  "🚀",
  "📈",
  "💎",
  "🧠",
  "🏦",
  "⚡",
  "🌱",
  "🔥",
  "🎯",
  "🪙",
  "🌊",
  "🛡️",
];

const DEFAULT_LIST_SNAPSHOT: UserList[] = [buildWatchlist()];
let cachedSnapshot = DEFAULT_LIST_SNAPSHOT;
let cachedSnapshotKey = JSON.stringify(DEFAULT_LIST_SNAPSHOT);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

function getTimestamp(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function extractFirstGrapheme(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const firstSegment = segmenter.segment(trimmed)[Symbol.iterator]().next().value;
    return typeof firstSegment?.segment === "string" ? firstSegment.segment : null;
  }

  const firstCodePoint = Array.from(trimmed)[0];
  return firstCodePoint ?? null;
}

export function normalizeListEmoji(
  value: string | null | undefined,
  fallback = FALLBACK_CUSTOM_LIST_EMOJI
): string {
  return extractFirstGrapheme(value) ?? fallback;
}

export function getRandomListEmoji(): string {
  return LIST_EMOJI_OPTIONS[Math.floor(Math.random() * LIST_EMOJI_OPTIONS.length)];
}

function normalizeSymbol(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeEntry(value: unknown): SavedStockEntry | null {
  if (!isRecord(value)) return null;

  const symbol = normalizeSymbol(value.symbol);
  if (!symbol) return null;

  const name = getString(value.name) || symbol;

  return {
    symbol,
    name,
    addedAt: getTimestamp(value.addedAt, 0),
  };
}

function normalizeEntries(value: unknown): SavedStockEntry[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const entries: SavedStockEntry[] = [];

  for (const item of value) {
    const entry = normalizeEntry(item);
    if (!entry || seen.has(entry.symbol)) continue;
    seen.add(entry.symbol);
    entries.push(entry);
  }

  return entries;
}

function buildWatchlist(entries: SavedStockEntry[] = []): UserList {
  const createdAt =
    entries.length > 0
      ? entries.reduce((min, entry) => (entry.addedAt > 0 ? Math.min(min, entry.addedAt) : min), entries[0]?.addedAt || 0)
      : 0;

  const updatedAt =
    entries.length > 0
      ? entries.reduce((max, entry) => Math.max(max, entry.addedAt), 0)
      : 0;

  return {
    id: WATCHLIST_ID,
    name: WATCHLIST_NAME,
    emoji: WATCHLIST_EMOJI,
    createdAt,
    updatedAt,
    entries,
  };
}

function normalizeList(value: unknown, index: number): UserList | null {
  if (!isRecord(value)) return null;

  const rawId = getString(value.id);
  const id = rawId || `list-${index + 1}`;
  const isWatchlist = id === WATCHLIST_ID;
  const name = isWatchlist ? WATCHLIST_NAME : getString(value.name) || `${FALLBACK_LIST_NAME} ${index + 1}`;
  const emoji = normalizeListEmoji(
    getString(value.emoji),
    isWatchlist ? WATCHLIST_EMOJI : FALLBACK_CUSTOM_LIST_EMOJI
  );
  const entries = normalizeEntries(value.entries);
  const createdAt = getTimestamp(value.createdAt, entries[0]?.addedAt ?? 0);
  const updatedAt = getTimestamp(value.updatedAt, createdAt);

  return {
    id,
    name,
    emoji,
    createdAt,
    updatedAt,
    entries,
  };
}

function normalizeLists(value: unknown): UserList[] {
  const normalized = Array.isArray(value)
    ? value
        .map((list, index) => normalizeList(list, index))
        .filter((list): list is UserList => Boolean(list))
    : [];

  const seenIds = new Set<string>();
  const deduped: UserList[] = [];

  for (const list of normalized) {
    if (seenIds.has(list.id)) continue;
    seenIds.add(list.id);
    deduped.push(list);
  }

  const watchlist = deduped.find((list) => list.id === WATCHLIST_ID) ?? buildWatchlist();
  const customLists = deduped.filter((list) => list.id !== WATCHLIST_ID);

  return [watchlist, ...customLists];
}

function readLegacyWatchlist(): SavedStockEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(LEGACY_WATCHLIST_STORAGE_KEY);
    if (!stored) return [];
    return normalizeEntries(JSON.parse(stored));
  } catch (error) {
    console.error("Failed to load legacy watchlist", error);
    return [];
  }
}

function getDefaultSnapshot(): UserList[] {
  return DEFAULT_LIST_SNAPSHOT;
}

function cacheSnapshot(nextLists: UserList[]): UserList[] {
  const nextKey = JSON.stringify(nextLists);

  if (nextKey === cachedSnapshotKey) {
    return cachedSnapshot;
  }

  cachedSnapshot = nextLists;
  cachedSnapshotKey = nextKey;
  return nextLists;
}

function readListsSnapshot(): UserList[] {
  if (typeof window === "undefined") return getDefaultSnapshot();

  try {
    const stored = window.localStorage.getItem(LISTS_STORAGE_KEY);
    if (stored) {
      return cacheSnapshot(normalizeLists(JSON.parse(stored)));
    }
  } catch (error) {
    console.error("Failed to load lists", error);
  }

  const legacyEntries = readLegacyWatchlist();
  if (legacyEntries.length > 0) {
    return cacheSnapshot([buildWatchlist(legacyEntries)]);
  }

  return getDefaultSnapshot();
}

function persistLists(nextLists: UserList[]): UserList[] {
  const normalized = cacheSnapshot(normalizeLists(nextLists));

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event(LISTS_UPDATED_EVENT));
  }

  return normalized;
}

function initializeListsStorage(): boolean {
  if (typeof window === "undefined") return false;

  const hadLegacyKey = window.localStorage.getItem(LEGACY_WATCHLIST_STORAGE_KEY) !== null;
  const previousLists = window.localStorage.getItem(LISTS_STORAGE_KEY);
  const nextLists = readListsSnapshot();
  const nextSerialized = JSON.stringify(nextLists);
  let changed = false;

  if (previousLists !== nextSerialized) {
    window.localStorage.setItem(LISTS_STORAGE_KEY, nextSerialized);
    changed = true;
  }

  if (hadLegacyKey) {
    window.localStorage.removeItem(LEGACY_WATCHLIST_STORAGE_KEY);
    changed = true;
  }

  return changed;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleUpdate = () => callback();
  const initializedChanged = initializeListsStorage();

  window.addEventListener(LISTS_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  if (initializedChanged) {
    queueMicrotask(() => callback());
  }

  return () => {
    window.removeEventListener(LISTS_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

function createListId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeListName(value: string | null | undefined, fallback = FALLBACK_LIST_NAME): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export function useLists() {
  const lists = useSyncExternalStore(subscribe, readListsSnapshot, getDefaultSnapshot);

  const createList = (name: string, emoji?: string): UserList => {
    const timestamp = Date.now();
    const list: UserList = {
      id: createListId(),
      name: sanitizeListName(name),
      emoji: normalizeListEmoji(emoji, getRandomListEmoji()),
      createdAt: timestamp,
      updatedAt: timestamp,
      entries: [],
    };

    persistLists([...readListsSnapshot(), list]);
    return list;
  };

  const updateList = (
    listId: string,
    updates: Partial<Pick<UserList, "name" | "emoji">>
  ): UserList | null => {
    const currentLists = readListsSnapshot();
    let updatedList: UserList | null = null;

    const nextLists = currentLists.map((list) => {
      if (list.id !== listId) return list;

      updatedList = {
        ...list,
        name:
          list.id === WATCHLIST_ID
            ? WATCHLIST_NAME
            : sanitizeListName(updates.name ?? list.name, list.name),
        emoji:
          updates.emoji === undefined
            ? list.emoji
            : normalizeListEmoji(
                updates.emoji,
                list.id === WATCHLIST_ID ? WATCHLIST_EMOJI : list.emoji
              ),
        updatedAt: Date.now(),
      };

      return updatedList;
    });

    if (!updatedList) return null;

    persistLists(nextLists);
    return updatedList;
  };

  const addToList = (listId: string, symbol: string, name = symbol): boolean => {
    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) return false;

    const currentLists = readListsSnapshot();
    let didAdd = false;

    const nextLists = currentLists.map((list) => {
      if (list.id !== listId) return list;
      if (list.entries.some((entry) => entry.symbol === normalizedSymbol)) return list;

      didAdd = true;

      return {
        ...list,
        updatedAt: Date.now(),
        entries: [
          ...list.entries,
          {
            symbol: normalizedSymbol,
            name: name.trim() || normalizedSymbol,
            addedAt: Date.now(),
          },
        ],
      };
    });

    if (didAdd) {
      persistLists(nextLists);
    }

    return didAdd;
  };

  const removeFromList = (listId: string, symbol: string): boolean => {
    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) return false;

    const currentLists = readListsSnapshot();
    let didRemove = false;

    const nextLists = currentLists.map((list) => {
      if (list.id !== listId) return list;

      const nextEntries = list.entries.filter((entry) => entry.symbol !== normalizedSymbol);
      if (nextEntries.length === list.entries.length) return list;

      didRemove = true;

      return {
        ...list,
        updatedAt: Date.now(),
        entries: nextEntries,
      };
    });

    if (didRemove) {
      persistLists(nextLists);
    }

    return didRemove;
  };

  const toggleInList = (listId: string, symbol: string, name = symbol): boolean => {
    const normalizedSymbol = normalizeSymbol(symbol);

    if (
      lists.some(
        (list) =>
          list.id === listId &&
          list.entries.some((entry) => entry.symbol === normalizedSymbol)
      )
    ) {
      removeFromList(listId, symbol);
      return false;
    }

    addToList(listId, symbol, name);
    return true;
  };

  const isInList = (listId: string, symbol: string): boolean => {
    const normalizedSymbol = normalizeSymbol(symbol);
    return lists.some(
      (list) =>
        list.id === listId &&
        list.entries.some((entry) => entry.symbol === normalizedSymbol)
    );
  };

  const getListsForSymbol = (symbol: string): UserList[] => {
    const normalizedSymbol = normalizeSymbol(symbol);
    return lists.filter((list) =>
      list.entries.some((entry) => entry.symbol === normalizedSymbol)
    );
  };

  return {
    lists,
    createList,
    updateList,
    addToList,
    removeFromList,
    toggleInList,
    isInList,
    getListsForSymbol,
  };
}
