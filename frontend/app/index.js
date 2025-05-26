import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

const url = "https://daisy-consulting-smilepiscine-staging-20683340.dev.odoo.com";
const db = "daisy-consulting-smilepiscine-staging-20683340";
const username = "soufyanesmile@gmail.com";
const password = "soufyanesmile@gmail.com";

const authenticateOdoo = async () => {
  const endpoint = url.replace(/\/$/, '') + '/jsonrpc';
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "common",
      method: "authenticate",
      args: [db, username, password, {}]
    },
    id: Date.now()
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.result) {
      console.log("Authenticated as UID:", data.result);
      return data.result;
    } else {
      console.log("Authentication failed.");
      return null;
    }
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
};

export default function App() {
  const [uid, setUid] = useState(null);
  const router = useRouter();

  useEffect(() => {
    authenticateOdoo().then(authUid => {
      setUid(authUid);
      if (authUid) {
        // Redirect to HomeScreen after successful authentication
        router.replace('/Screens/HomeScreen');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>
        {uid ? `Authenticated as UID: ${uid}` : 'Authenticating...'}
      </Text>
    </View>
  );
}