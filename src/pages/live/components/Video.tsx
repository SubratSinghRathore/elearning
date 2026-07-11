import React, { useState } from 'react';
import { Buffer } from 'buffer';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Participant } from 'livekit-client';

interface MicProps {
  room: any;
  user: Participant,
}

const Video = ({ user, room }: MicProps) => {
  const [video, setVideo] = useState(false);

  const toggleVideo = async () => {
    const newState = !video;
    setVideo(newState);

    const message = {
      type: "toggle-video",
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
      style={[styles.controlButton, !video && styles.controlButtonActive]}
      onPress={toggleVideo}
    >
      <Icon
        name={!video ? 'video-off' : 'video'}
        size={22}
        color="#FFFFFF"
      />
      <Text style={styles.controlButtonText}>
        {video ? "video on" : "video off"}
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

export default Video;