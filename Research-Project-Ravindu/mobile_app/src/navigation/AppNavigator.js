import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ViolationsScreen from '../screens/ViolationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AccidentsScreen from '../screens/AccidentsScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = 'dashboard';
                    else if (route.name === 'Violations') iconName = 'warning';
                    else if (route.name === 'Accidents') iconName = 'emergency';
                    else if (route.name === 'Profile') iconName = 'person';

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2f95dc',
                tabBarInactiveTintColor: 'gray',
                headerShown: true,
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Violations" component={ViolationsScreen} />
            <Tab.Screen name="Accidents" component={AccidentsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { isAuthenticated } = useSelector(state => state.auth);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    <>
                        <Stack.Screen name="MainTabs" component={MainTabs} />
                        <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: true, title: 'Pay Fine' }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
