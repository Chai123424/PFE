import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Transfert from './Screens/TransferScreen';

function App() {
  return (
    <SafeAreaProvider>
      <Transfert />
    </SafeAreaProvider>
  );
}

// Correction ici 👇
export default App;
registerRootComponent(App);
