const persistedIds = new Set<string>();

let createInFlight = false;
let slugTouched = false;

export const hasId = (id: string): boolean => persistedIds.has(id);

export const addId = (id: string): void => {
  persistedIds.add(id);
};

export const removeId = (id: string): void => {
  persistedIds.delete(id);
};

export const isCreating = (): boolean => createInFlight;

export const startCreating = (): void => {
  createInFlight = true;
};

export const finishCreating = (): void => {
  createInFlight = false;
};

export const touchSlug = (): void => {
  slugTouched = true;
};

export const resetSlug = (): void => {
  slugTouched = false;
};

export const isSlugTouched = (): boolean => slugTouched;
