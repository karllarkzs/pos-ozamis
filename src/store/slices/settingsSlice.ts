import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SystemSettings {
  storeName: string;
  storeOwner: string;
  storeLocation: string;
  storeContact: string;
  vatAmount: number;
  showVat: boolean;
}

interface SettingsState {
  settings: SystemSettings;
  isLoading: boolean;
  lastFetched: string | null;
  error: string | null;
}

const initialState: SettingsState = {
  settings: {
    storeName: "OCT POS",
    storeOwner: "",
    storeLocation: "",
    storeContact: "",
    vatAmount: 0,
    showVat: false,
  },
  isLoading: false,
  lastFetched: null,
  error: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    fetchSettingsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    fetchSettingsSuccess: (state, action: PayloadAction<SystemSettings>) => {
      state.settings = action.payload;
      state.isLoading = false;
      state.lastFetched = new Date().toISOString();
      state.error = null;
    },

    fetchSettingsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    clearSettings: (state) => {
      state.settings = initialState.settings;
      state.lastFetched = null;
      state.error = null;
    },
  },
});

export const {
  fetchSettingsStart,
  fetchSettingsSuccess,
  fetchSettingsFailure,
  clearSettings,
} = settingsSlice.actions;

// Selectors
export const selectSettings = (state: { settings: SettingsState }) =>
  state.settings.settings;
export const selectStoreName = (state: { settings: SettingsState }) =>
  state.settings.settings.storeName;
export const selectVatAmount = (state: { settings: SettingsState }) =>
  state.settings.settings.vatAmount;
export const selectShowVat = (state: { settings: SettingsState }) =>
  state.settings.settings.showVat;
export const selectSettingsLoading = (state: { settings: SettingsState }) =>
  state.settings.isLoading;
export const selectLastFetched = (state: { settings: SettingsState }) =>
  state.settings.lastFetched;

export default settingsSlice.reducer;
