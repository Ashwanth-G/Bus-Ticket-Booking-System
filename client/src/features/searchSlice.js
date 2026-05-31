import { createSlice } from '@reduxjs/toolkit';

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    sourceCity: '',
    destinationCity: '',
    travelDate: new Date().toISOString().split('T')[0],
    results: [],
    loading: false,
    error: null
  },
  reducers: {
    setSearchQuery(state, action) {
      state.sourceCity = action.payload.sourceCity;
      state.destinationCity = action.payload.destinationCity;
      state.travelDate = action.payload.travelDate;
    },
    setSearchResults(state, action) {
      state.results = action.payload;
    },
    clearSearch(state) {
      state.sourceCity = '';
      state.destinationCity = '';
      state.travelDate = new Date().toISOString().split('T')[0];
      state.results = [];
    }
  }
});

export const { setSearchQuery, setSearchResults, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
