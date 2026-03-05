import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import api from '../services/api';
import * as Keychain from 'react-native-keychain';

const LoginScreen = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();

    const handleLogin = async () => {
        try {
            const response = await api.post('/auth/login', { phone, password });
            if (response.data.success) {
                // Securely store the token
                await Keychain.setGenericPassword('token', response.data.token);

                // Dispatch to Redux to update UI state
                dispatch(setCredentials({
                    user: response.data.user,
                    token: response.data.token,
                }));
            }
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Smart Traffic System</Text>
            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: '#333' },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    button: { backgroundColor: '#2f95dc', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default LoginScreen;
