import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDriverData } from '../store/slices/driverSlice';
import CircularProgress from 'react-native-circular-progress-indicator';

const DashboardScreen = () => {
    const dispatch = useDispatch();
    const { profile, loading, error } = useSelector(state => state.driver);

    useEffect(() => {
        dispatch(fetchDriverData());
    }, [dispatch]);

    if (loading || !profile) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2f95dc" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Welcome, {profile.driverName}</Text>

            <View style={styles.scoreContainer}>
                <Text style={styles.scoreTitle}>Driver Score</Text>
                <CircularProgress
                    value={profile.driverScore}
                    radius={80}
                    duration={1500}
                    progressValueColor={'#333'}
                    maxValue={100}
                    title={'/ 100'}
                    titleColor={'#666'}
                    titleStyle={{ fontWeight: 'bold' }}
                    activeStrokeColor={profile.driverScore > 80 ? '#4caf50' : profile.driverScore > 50 ? '#ff9800' : '#f44336'}
                />
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Violations</Text>
                    <Text style={styles.statValue}>{profile.totalViolations}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Risk Level</Text>
                    <Text style={[styles.statValue, { color: profile.riskLevel === 'HIGH' ? 'red' : 'green' }]}>
                        {profile.riskLevel}
                    </Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Recent Speed</Text>
                    <Text style={styles.statValue}>{profile.recentSpeedStatus}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#333' },
    scoreContainer: { alignItems: 'center', marginBottom: 40, backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3 },
    scoreTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20, color: '#555' },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
    statBox: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center', elevation: 2 },
    statLabel: { fontSize: 14, color: '#666', marginBottom: 10 },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    errorText: { color: 'red', fontSize: 16 },
});

export default DashboardScreen;
