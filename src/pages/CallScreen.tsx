// import React from 'react';

// import {
//     View,
//     StyleSheet,
//     TouchableOpacity,
//     Text,
// } from 'react-native';

// import {
//     RoomAudioRenderer,
//     VideoTrack,
//     useTracks,
//     useLocalParticipant,
//     useRoomContext,
// } from '@livekit/react-native';

// import { Track } from 'livekit-client';

// import Icon from 'react-native-vector-icons/Feather';

// export default function CallScreen() {

//     const room = useRoomContext();

//     const { localParticipant } = useLocalParticipant();
//     const tracks = useTracks([
//         {
//             source: Track.Source.Camera,
//             withPlaceholder: true,
//         },
//     ]);

//     const remoteTracks = tracks.filter(

//         track =>

//             track.participant.identity !==

//             localParticipant.identity

//     );

//     const localTracks = tracks.filter(

//         track =>

//             track.participant.identity ===

//             localParticipant.identity

//     );

//     return (

//         <View style={styles.container}>

//             <RoomAudioRenderer />
//             <View style={styles.remoteContainer}>

//                 {

//                     remoteTracks.map(track => (

//                         <VideoTrack

//                             key={track.participant.identity}

//                             trackRef={track}

//                             style={styles.remoteVideo}

//                         />

//                     ))

//                 }

//                 <View style={styles.localContainer}>

//                     {

//                         localTracks.map(track => (

//                             <VideoTrack

//                                 key={track.participant.identity}

//                                 trackRef={track}

//                                 style={styles.localVideo}

//                             />

//                         ))

//                     }

//                 </View>

//             </View>

//         </View>

//     )

// }

// const styles = StyleSheet.create({

//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#000'
//     },

//     text: {
//         color: '#fff',
//         fontSize: 22
//     }

// });