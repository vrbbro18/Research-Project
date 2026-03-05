import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AccidentsScreen = () => {
    const [accidents, setAccidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccidents();
    }, []);

    const fetchAccidents = async () => {
        try {
            const response = await api.get('/accidents');
            setAccidents(response.data.data);
        } catch (error) {
            console.log('Error fetching accidents', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSOS = () => {
        Alert.alert('Emergency SOS', 'Are you sure you want to trigger an SOS alert?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send SOS', onPress: () => Alert.alert('SOS Sent', 'Emergency services and contacts have been notified.') }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(item.timestamp).toLocaleString()}</Text>
                <Text style={[styles.riskLevel, { color: item.riskLevel === 'HIGH' ? 'red' : 'orange' }]}>
                    {item.riskLevel} Risk
                </Text>
            </View>
            <Text style={styles.location}>Location: {item.location}</Text>
            <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${item.emergencyContact}`)}
            >
                <Icon name="phone" size={20} color="#2f95dc" />
                <Text style={styles.contactText}>Call Emergency: {item.emergencyContact}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Accident Alerts</Text>
                <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                    <Icon name="warning" size={24} color="#fff" />
                    <Text style={styles.sosText}>SOS</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2f95dc" style={styles.centered} />
            ) : (
                <FlatList
                    data={accidents}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshing={loading}
                    onRefresh={fetchAccidents}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5', padding: 15 },
    centered: { flex: 1, justifyContent: 'center' },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    header: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    sosButton: { flexDirection: 'row', backgroundColor: '#d32f2f', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, alignItems: 'center' },
    sosText: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 16 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    date: { fontSize: 14, fontWeight: '600', color: '#555' },
    riskLevel: { fontWeight: 'bold', fontSize: 14 },
    location: { fontSize: 16, color: '#444', marginBottom: 15 },
    contactRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', padding: 10, borderRadius: 8 },
    contactText: { color: '#1976d2', fontWeight: '600', marginLeft: 10 },
});

export default AccidentsScreen;
