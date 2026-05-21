const persistedIds = new Set<string>();

let createInFlight = false;
let slugTouched = false;

export const hasPersistedId = (id: string): boolean => persistedIds.has(id);

export const addPersistedId = (id: string): void => {
  persistedIds.add(id);
};

export const removePersistedId = (id: string): void => {
  persistedIds.delete(id);
};

export const isCreateInFlight = (): boolean => createInFlight;

export const startCreateInFlight = (): void => {
  createInFlight = true;
};

export const finishCreateInFlight = (): void => {
  createInFlight = false;
};

export const markSlugTouched = (): void => {
  slugTouched = true;
};

export const resetSlugTouched = (): void => {
  slugTouched = false;
};

export const getSlugTouched = (): boolean => slugTouched;
