import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import driverReducer from './slices/driverSlice';
import violationsReducer from './slices/violationsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        driver: driverReducer,
        violations: violationsReducer,
    },
});
