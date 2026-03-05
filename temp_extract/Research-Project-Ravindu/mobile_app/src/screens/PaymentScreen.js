import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { payViolation } from '../store/slices/violationsSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PaymentScreen = ({ route, navigation }) => {
    const { violationId, fineAmount } = route.params;
    const dispatch = useDispatch();
    const { paymentLoading } = useSelector(state => state.violations);

    const handlePayment = async () => {
        try {
            await dispatch(payViolation(violationId)).unwrap();
            Alert.alert('Success', 'Payment processed successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Payment Failed', error);
        }
    };

    return (
        <View style={styles.container}>
            <Icon name="payment" size={80} color="#2f95dc" style={styles.icon} />
            <Text style={styles.title}>Fine Payment</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Amount Due</Text>
                <Text style={styles.amount}>${fineAmount.toFixed(2)}</Text>
                <Text style={styles.mockInfo}>(Mock Stripe Integration)</Text>
            </View>

            <TouchableOpacity
                style={styles.payButton}
                onPress={handlePayment}
                disabled={paymentLoading}
            >
                {paymentLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.payButtonText}>Confirm Payment</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20, alignItems: 'center', pt: 40 },
    icon: { marginBottom: 20, marginTop: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 40 },
    card: { backgroundColor: '#fff', width: '100%', padding: 30, borderRadius: 15, alignItems: 'center', elevation: 3, marginBottom: 40 },
    label: { fontSize: 16, color: '#666', marginBottom: 10 },
    amount: { fontSize: 40, fontWeight: 'bold', color: '#1976d2' },
    mockInfo: { fontSize: 12, color: '#aaa', marginTop: 10 },
    payButton: { backgroundColor: '#4caf50', width: '100%', padding: 18, borderRadius: 10, alignItems: 'center' },
    payButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default PaymentScreen;
