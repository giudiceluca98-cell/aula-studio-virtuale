export const UI_THEME_STORAGE_KEY = "aula-ui-theme";

export const UI_THEMES = ["classic", "futuristic-focus"] as const;

export type UiTheme = (typeof UI_THEMES)[number];

export function isUiTheme(value: unknown): value is UiTheme {
  return typeof value === "string" && UI_THEMES.includes(value as UiTheme);
}

export function readStoredUiTheme(storage: Pick<Storage, "getItem"> | null = null): UiTheme {
  if (!storage) return "classic";
  try {
    const value = storage.getItem(UI_THEME_STORAGE_KEY);
    return isUiTheme(value) ? value : "classic";
  } catch {
    return "classic";
  }
}
