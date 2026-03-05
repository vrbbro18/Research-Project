import axios from 'axios';
import * as Keychain from 'react-native-keychain';

// Replace localhost with your development machine's IP address when testing on a physical device.
// 10.0.2.2 is the alias for your host machine's loopback interface from the Android emulator.
const API_URL = 'http://10.0.2.2:3001/api/mobile';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

api.interceptors.request.use(
    async config => {
        try {
            const credentials = await Keychain.getGenericPassword();
            if (credentials) {
                config.headers.Authorization = `Bearer ${credentials.password}`;
            }
        } catch (error) {
            console.log('Keychain could not be accessed!', error);
        }
        return config;
    },
    error => Promise.reject(error)
);

export default api;
