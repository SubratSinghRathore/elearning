import React, { useState } from 'react';
import { Buffer } from 'buffer';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Participant } from 'livekit-client';

interface MicProps {
  room: any;
  user: Participant
}

const Mic = ({ room, user }: MicProps) => {
  const [mic, setMic] = useState(false);

  const toggleMic = async () => {
    const newState = !mic;
    setMic(newState);


    const message = {
      type: "toggle-mic",
      targetId: user.identity,
      enabled: newState,
    };

    await room.localParticipant.publishData(
      Buffer.from(JSON.stringify(message), "utf8"),
      { reliable: true }
    );
  };

  return (
    <TouchableOpacity
      style={[styles.controlButton, !mic && styles.controlButtonActive]}
      onPress={toggleMic}
    >
      <Icon
        name={mic ? "mic" : "mic-off"}
        size={22}
        color="#FFFFFF"
      />
      <Text style={styles.controlButtonText}>
        {mic ? "Mute" : "Unmute"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
  },
  controlButtonActive: {
    opacity: 0.8,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 2,
  },
});

export default Mic;