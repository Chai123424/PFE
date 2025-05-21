import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* The first screen in the stack is the initial route */}
      <Stack.Screen name="screens/LoadingScreen" options={{ headerShown: false }} />
      <Stack.Screen name="screens/LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="screens/HomeScreen" options={{ headerShown: false }} />
      {/* DetailScreen will likely need the header provided within the component */}
      <Stack.Screen name="screens/DetailScreen" options={{ headerShown: false }} />
    </Stack>
  );
} 