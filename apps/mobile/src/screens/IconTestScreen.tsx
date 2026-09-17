// Create at: migo-mobile/src/screens/IconTestScreen.tsx
import React from 'react';
import { View, Image, Text, StyleSheet, ScrollView } from 'react-native';

const IconTestScreen = () => {
  const icons = [
    { name: 'home', path: require('../../assets/icons/home.png') },
    { name: 'events', path: require('../../assets/icons/events.png') },
    { name: 'AIchat', path: require('../../assets/icons/AIchat.png') },
    { name: 'profile', path: require('../../assets/icons/profile.png') },
    { name: 'logo', path: require('../../assets/icon.png') },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Icon Test Screen</Text>
      {icons.map((icon, index) => (
        <View key={index} style={styles.iconRow}>
          <Text style={styles.iconName}>{icon.name}</Text>
          <Image 
            source={icon.path} 
            style={styles.iconImage}
            resizeMode="contain"
          />
          <Text style={styles.status}>Loaded</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  iconRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  iconName: { width: 80, fontSize: 16 },
  iconImage: { width: 40, height: 40, marginHorizontal: 10 },
  status: { color: 'green' },
});

export default IconTestScreen;