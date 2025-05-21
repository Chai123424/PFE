import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Info from './Screens/InfoScreen';

function App() {
  return (
    <SafeAreaProvider>
      <Info />
    </SafeAreaProvider>
  );
}

// Correction ici 👇
export default App;
registerRootComponent(App);