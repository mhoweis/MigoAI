import React from 'react';
import MapView, { Marker } from 'react-native-maps';

interface EventMapProps {
  latitude: number;
  longitude: number;
  title: string;
  description?: string | null;
}

export default function EventMap({
  latitude,
  longitude,
  title,
  description,
}: EventMapProps) {
  return (
    <MapView
      style={{ height: 220, borderRadius: 12 }}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title={title}
        description={description ?? undefined}
      />
    </MapView>
  );
}