import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BackendHostel {
  _id: string;
  name: string;
  description?: string;
  location: {
    address?: string;
    city?: string;
    nearbyUniversity?: string;
    coordinates?: [number, number] | number[];
  };
  pricePerMonth: number;
  hostelType: 'male' | 'female' | 'mixed';
  totalRooms: number;
  availableRooms: number;
  amenities: {
    wifi: boolean;
    water: boolean;
    electricity: boolean;
    security: boolean;
    parking: boolean;
    laundry: boolean;
    kitchen: boolean;
    airCondition: boolean;
  };
  images: string[];
  ratings: { student: { username: string } | string; rating: number; review: string; createdAt: string }[];
  averageRating: number;
  owner: { username: string; email: string };
  isApproved?: boolean;
  isActive?: boolean;
}

interface HostelState {
  list: BackendHostel[];
  listLoaded: boolean;
  byId: Record<string, BackendHostel>;
}

const initialState: HostelState = {
  list: [],
  listLoaded: false,
  byId: {},
};

const hostelSlice = createSlice({
  name: 'hostels',
  initialState,
  reducers: {
    setHostelList(state, action: PayloadAction<BackendHostel[]>) {
      state.list = action.payload;
      state.listLoaded = true;
      // Also populate the byId cache
      action.payload.forEach((h) => {
        state.byId[h._id] = h;
      });
    },
    cacheHostel(state, action: PayloadAction<BackendHostel>) {
      state.byId[action.payload._id] = action.payload;
    },
    clearHostelList(state) {
      state.list = [];
      state.listLoaded = false;
    },
  },
});

export const { setHostelList, cacheHostel, clearHostelList } = hostelSlice.actions;
export default hostelSlice.reducer;
