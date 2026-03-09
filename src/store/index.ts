import { configureStore } from '@reduxjs/toolkit';
import hostelReducer from './hostelSlice';
import bookingReducer from './bookingSlice';

export const store = configureStore({
  reducer: {
    hostels: hostelReducer,
    bookings: bookingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
