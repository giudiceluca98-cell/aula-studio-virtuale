"use client";

import type { EvePanelOpenRequest } from "./contracts";

export const EVE_PANEL_OPEN_EVENT = "eve:panel:open";
export const EVE_PANEL_CLOSE_EVENT = "eve:panel:close";
export const EVE_PANEL_TOGGLE_EVENT = "eve:panel:toggle";

export function requestEvePanelOpen(request: EvePanelOpenRequest): void {
  window.dispatchEvent(new CustomEvent<EvePanelOpenRequest>(EVE_PANEL_OPEN_EVENT, { detail: request }));
}

export function requestEvePanelClose(): void {
  window.dispatchEvent(new Event(EVE_PANEL_CLOSE_EVENT));
}

export function requestEvePanelToggle(): void {
  window.dispatchEvent(new Event(EVE_PANEL_TOGGLE_EVENT));
}
