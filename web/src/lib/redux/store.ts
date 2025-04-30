import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import eventReducer from "./features/authSlice";
import userReducer from "./features/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
