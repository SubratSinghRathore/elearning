import { View, Text } from 'react-native'
import React, { useEffect, useState, } from 'react'
import { StyleSheet } from 'react-native';

const Timer = () => {

    const [time, setTime] = useState(0);

      const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

    // Call duration timer
    useEffect(() => {
        setInterval(() => {
            setTime((prev) => prev + 1);
        }, 1000);
    }, [])
    return (
    <View>
        <View style={styles.callInfoBar}>
            <Text style={styles.callInfoDuration}>⏱ {formatDuration(time)}</Text>
        </View>
    </View>
)
}

const styles = StyleSheet.create({
    callInfoBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },

    callInfoTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },

    callInfoDuration: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default Timer