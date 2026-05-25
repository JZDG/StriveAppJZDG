import 'react-native-gesture-handler';
import { LogBox } from 'react-native';

// Suppress Expo Go internal warnings (not actual bugs)
LogBox.ignoreLogs([
  'Could not access feature flag',
  'disableEventLoopOnBridgeless',
  'native module',
  'new NativeEventEmitter',
  'Non-serializable values',
]);

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
