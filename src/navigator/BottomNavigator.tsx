import { View, Text } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

//Screens
import Home from '../pages/Home'
import Profile from '../pages/Profile'
import Assignment from '../pages/Assignment';
import Live from '../pages/Live';
import Content from '../pages/Content'

export type RootTabParamList = {
    Home: undefined,
    Live: undefined,
    Assignment: undefined,
    Profile: undefined,
    Content: undefined,
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const BottomNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#4F46E5",
                tabBarInactiveTintColor: "gray",
                tabBarActiveBackgroundColor: "#ffffff",
                tabBarStyle: {
                    height: 65,
                    backgroundColor: "#ffffff",
                    borderTopWidth: 0,
                    elevation: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 14,
                    fontWeight: '600',
                    borderRadius: 10
                },
                tabBarItemStyle: {
                    borderRadius: 12,
                    overflow: "hidden",
                },
            }}>
            <Tab.Screen name='Home' component={Home} options={{
                tabBarIcon: ({ color, size }) => (
                    <Icon name="home" color={color} size={size} />
                ),
            }}></Tab.Screen>
            <Tab.Screen name='Live' component={Live} options={{
                tabBarIcon: ({ color, size }) => (
                    <Icon name="video-wireless" color={color} size={size} />
                ),
            }} ></Tab.Screen>
            <Tab.Screen name='Content' component={Content} options={{
                tabBarIcon: ({ color, size }) => (
                    <Icon name="file-multiple" color={color} size={size} />
                ),
            }} ></Tab.Screen>
            <Tab.Screen name='Assignment' component={Assignment} options={{
                tabBarIcon: ({ color, size }) => (
                    <Icon name="clipboard-text" color={color} size={size} />
                ),
            }} ></Tab.Screen>
            <Tab.Screen name='Profile' component={Profile} options={{
                tabBarIcon: ({ color, size }) => (
                    <Icon name="account" color={color} size={size} />
                ),
            }} ></Tab.Screen>
        </Tab.Navigator>
    )
}

export default BottomNavigator