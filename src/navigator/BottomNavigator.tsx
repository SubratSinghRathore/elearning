import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { useAuth } from "../context/AuthContext"

//Screens
import Home from '../pages/Home'
import Profile from '../pages/profile/Profile'
import Assignment from '../pages/assignment/Assignment';
import Live from '../pages/live/Live';
import Content from '../pages/materials/Content'
import Academics from '../pages/academics/Academics';

export type RootTabParamList = {
    Home: undefined,
    Live: undefined,
    Work: undefined,
    Profile: undefined,
    Content: undefined,
    Academics: undefined,
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const BottomNavigator = () => {

    const { user } = useAuth()

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#4F46E5",
                tabBarInactiveTintColor: "gray",
                tabBarShowLabel: true,
                tabBarActiveBackgroundColor: "#ffffff",
                tabBarStyle: {
                    height: 70,
                    backgroundColor: "#ffffff",
                    borderTopWidth: 1,
                    borderTopColor: "#9a97d7",
                    elevation: 0,
                },
                tabBarItemStyle: {
                    paddingTop: 8,
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
            {user?.role === 'TEACHER' &&
                <Tab.Screen name='Academics' component={Academics} options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="town-hall" color={color} size={size} />
                    ),
                }} ></Tab.Screen>
            }
            <Tab.Screen name='Work' component={Assignment} options={{
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