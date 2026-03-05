import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDriverData = createAsyncThunk(
    'driver/fetchDriverData',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/driver/dashboard');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch driver data');
        }
    }
);

const initialState = {
    profile: null,
    loading: false,
    error: null,
};

const driverSlice = createSlice({
    name: 'driver',
    initialState,
    reducers: {
        clearDriverData: state => {
            state.profile = null;
            state.error = null;
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchDriverData.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDriverData.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload.data;
            })
            .addCase(fetchDriverData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearDriverData } = driverSlice.actions;

export default driverSlice.reducer;
