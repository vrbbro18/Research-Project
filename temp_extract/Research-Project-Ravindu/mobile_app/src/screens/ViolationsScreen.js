import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchViolations } from '../store/slices/violationsSlice';
import { useNavigation } from '@react-navigation/native';

const ViolationsScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { list, loading, error } = useSelector(state => state.violations);

    useEffect(() => {
        dispatch(fetchViolations());
    }, [dispatch]);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                <Text style={[styles.status, item.paymentStatus === 'PAID' ? styles.statusPaid : styles.statusPending]}>
                    {item.paymentStatus}
                </Text>
            </View>
            <Text style={styles.location}>Location: {item.location}</Text>
            <Text style={styles.speed}>Speed: {item.speed} km/h ({item.speedLevel})</Text>
            <View style={styles.bottomRow}>
                <Text style={styles.fine}>Fine: ${item.fineAmount}</Text>
                {item.paymentStatus !== 'PAID' && (
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => navigation.navigate('Payment', { violationId: item.id, fineAmount: item.fineAmount })}
                    >
                        <Text style={styles.payButtonText}>Pay Now</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (loading && list.length === 0) {
        return <ActivityIndicator size="large" color="#2f95dc" style={styles.centered} />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Speed Violations</Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <FlatList
                data={list}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshing={loading}
                onRefresh={() => dispatch(fetchViolations())}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5', padding: 15 },
    centered: { flex: 1, justifyContent: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    date: { fontSize: 16, fontWeight: '600', color: '#555' },
    status: { fontWeight: 'bold', fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
    statusPaid: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
    statusPending: { backgroundColor: '#ffebee', color: '#c62828' },
    location: { fontSize: 16, color: '#444', marginBottom: 5 },
    speed: { fontSize: 16, color: '#444', marginBottom: 15 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fine: { fontSize: 18, fontWeight: 'bold', color: '#1976d2' },
    payButton: { backgroundColor: '#2f95dc', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    payButtonText: { color: '#fff', fontWeight: 'bold' },
    error: { color: 'red', marginBottom: 10 },
});

export default ViolationsScreen;
