const TOKEN_STORAGE_KEY = "utn-tfi.token";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  set(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  },

  clear(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};
