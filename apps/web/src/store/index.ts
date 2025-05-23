import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { api } from "./services/api";

export function makeStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },

    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
}

const store = makeStore();

// Add get method to store for compatibility with some libraries
store.get = function(key: string) {
  const state = this.getState();
  return state[key];
};

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
