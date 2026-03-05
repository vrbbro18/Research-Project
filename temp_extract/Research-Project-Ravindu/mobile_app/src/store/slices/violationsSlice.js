import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchViolations = createAsyncThunk(
    'violations/fetchViolations',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/violations');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch violations');
        }
    }
);

export const payViolation = createAsyncThunk(
    'violations/payViolation',
    async (violationId, { rejectWithValue }) => {
        try {
            const response = await api.post('/payments', { violationId, paymentMethodId: 'mock-stripe-token' });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Payment failed');
        }
    }
);

const initialState = {
    list: [],
    loading: false,
    error: null,
    paymentLoading: false,
    paymentError: null,
};

const violationsSlice = createSlice({
    name: 'violations',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            // Fetch Violations
            .addCase(fetchViolations.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchViolations.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.data;
            })
            .addCase(fetchViolations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Pay Violation
            .addCase(payViolation.pending, state => {
                state.paymentLoading = true;
                state.paymentError = null;
            })
            .addCase(payViolation.fulfilled, (state, action) => {
                state.paymentLoading = false;
                const index = state.list.findIndex(v => v.id === action.payload.updatedViolationId);
                if (index !== -1) {
                    state.list[index].paymentStatus = 'PAID';
                }
            })
            .addCase(payViolation.rejected, (state, action) => {
                state.paymentLoading = false;
                state.paymentError = action.payload;
            });
    },
});

export default violationsSlice.reducer;
