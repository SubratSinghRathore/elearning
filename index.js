/**
 * @format
 */

import { registerGlobals } from '@livekit/react-native';

// Must be called before importing App
registerGlobals();

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);