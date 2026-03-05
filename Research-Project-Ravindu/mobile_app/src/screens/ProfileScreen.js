import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { clearDriverData } from '../store/slices/driverSlice';
import * as Keychain from 'react-native-keychain';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    const handleLogout = async () => {
        await Keychain.resetGenericPassword();
        dispatch(clearDriverData());
        dispatch(logout());
    };

    if (!user) return <View style={styles.container} />;

    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                <Icon name="account-circle" size={100} color="#bbb" />
                <Text style={styles.name}>{user.driverName}</Text>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Icon name="badge" size={24} color="#555" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>License Number</Text>
                        <Text style={styles.infoValue}>{user.licenseNumber}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Icon name="directions-car" size={24} color="#555" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Vehicle Number</Text>
                        <Text style={styles.infoValue}>{user.vehicleNumber}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Icon name="nfc" size={24} color="#555" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>RFID Tag</Text>
                        <Text style={styles.infoValue}>{user.rfidId}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="logout" size={20} color="#fff" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
    avatarContainer: { alignItems: 'center', marginVertical: 30 },
    name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 10 },
    infoSection: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 2, marginBottom: 40 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    infoTextContainer: { marginLeft: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flex: 1, paddingBottom: 10 },
    infoLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    infoValue: { fontSize: 16, color: '#333', fontWeight: '500' },
    logoutButton: { flexDirection: 'row', backgroundColor: '#d32f2f', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    logoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});

export default ProfileScreen;
