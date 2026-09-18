import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EventMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

export default function EventMap({ latitude, longitude, title }: EventMapProps) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <TouchableOpacity onPress={() => Linking.openURL(mapUrl)} activeOpacity={0.8}>
      <View style={styles.container}>
        <Ionicons name="map-outline" size={32} color="#3b82f6" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.coordinates}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
        <Text style={styles.link}>Open in Google Maps</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  title: {
    marginTop: 12,
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  coordinates: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 13,
  },
  link: {
    marginTop: 12,
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
});