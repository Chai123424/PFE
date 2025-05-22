import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack 
    screenOptions={{
        headerShown: false, // désactive tous les headers
      }}
  />;
}
