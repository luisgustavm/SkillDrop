"use client";

import { create } from "zustand";

type UiState = {
  sidebarOpen: boolean;
  globalSearch: string;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setGlobalSearch: (query: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  globalSearch: "",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setGlobalSearch: (query) => set({ globalSearch: query }),
}));
