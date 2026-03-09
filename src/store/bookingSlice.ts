import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BookingItem {
  _id: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  roomsBooked: number;
  payment?: { method: string; status: string; reference?: string };
  hostel?: {
    _id: string;
    name: string;
    location?: { address?: string; city?: string };
    pricePerMonth?: number;
    images?: string[];
  };
}

interface BookingState {
  list: BookingItem[];
  loaded: boolean;
}

const initialState: BookingState = {
  list: [],
  loaded: false,
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings(state, action: PayloadAction<BookingItem[]>) {
      state.list = action.payload;
      state.loaded = true;
    },
    clearBookings(state) {
      state.list = [];
      state.loaded = false;
    },
  },
});

export const { setBookings, clearBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
