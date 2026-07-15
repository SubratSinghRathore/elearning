import { Participant, TrackPublication } from "livekit-client";

export interface VideoCallProps {
  navigation: any;
  route: {
    params: {
      roomName: string;
      token: string;
      serverURL: string;
      participantName: string;
      participantRole: string;
      sessionId: string;
      title: string;
      teacher: string;
      subject: string;
      batch: string;
    };
  };
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
  isSystem?: boolean;
}

// Minimal shape @livekit/react-native's <VideoTrack /> needs to render a tile.
export interface VideoTrackInfo {
  participant: Participant;
  publication: TrackPublication;
}