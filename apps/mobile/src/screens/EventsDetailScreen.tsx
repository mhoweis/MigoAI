// src/screens/EventDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { api } from '../services/api';
import { Event } from '@migo/shared';
import { useUserStore } from '../store/userStore';
import { useSavedEventsStore } from '../store/savedEventsStore';
import { getPlatinumlistUrl, isPlatinumlistUrl } from '../config/affiliates';

const { width } = Dimensions.get('window');

interface Props {
  route: any;
  navigation: any;
}

const EventDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserStore();
  const { savedIds, toggleSaved, loadSavedEvents } = useSavedEventsStore();

  useEffect(() => {
    fetchEvent();
    loadSavedEvents();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/events/${eventId}`);

      if (response.data.success) {
        setEvent(response.data.data);
      } else {
        setError('Event not found');
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = () => {
    if (event) toggleSaved(event);
  };

  const handleShare = async () => {
    if (!event) return;

    const eventDate = new Date(event.startDate);
    const dateStr = eventDate.toLocaleDateString();
    const timeStr = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      await Share.share({
        message: `Check out this event: ${event.title}\n\n${event.description || 'No description'}\n\nDate: ${dateStr} at ${timeStr}\nLocation: ${event.venueName || event.city || 'TBA'}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share event');
    }
  };

  const handleBookTicket = () => {
    if (!event) return;
    const affiliateUrl = getPlatinumlistUrl(event.externalUrl);
    Linking.openURL(affiliateUrl).catch(() =>
      Alert.alert('Error', 'Unable to open booking page. Please try again.')
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Event not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchEvent}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Event Image */}
        <View style={styles.imageContainer}>
          {event.coverImage ? (
            <Image source={{ uri: event.coverImage }} style={styles.eventImage} />
          ) : (
            <View style={[styles.eventImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={64} color="#d1d5db" />
            </View>
          )}
          <View style={styles.imageOverlay}>
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleBookmark}
              >
                <Ionicons
                  name={event && savedIds.has(event.id) ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Event Content */}
        <View style={styles.content}>
          {/* Event Header */}
          <View style={styles.eventHeader}>
            <View style={styles.eventCategoryContainer}>
              <Text style={styles.eventCategory}>{event.category || 'Event'}</Text>
              {event.locationType === 'ONLINE' && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>ONLINE</Text>
                </View>
              )}
            </View>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {event.organizer && (
              <View style={styles.eventOrganizer}>
                {event.organizer.avatarUrl ? (
                  <Image
                    source={{ uri: event.organizer.avatarUrl }}
                    style={styles.organizerAvatar}
                  />
                ) : (
                  <View style={styles.organizerAvatar}>
                    <Ionicons name="person-circle-outline" size={32} color="#9ca3af" />
                  </View>
                )}
                <Text style={styles.organizerName}>
                  {event.organizer.displayName || event.organizer.name}
                </Text>
              </View>
            )}
          </View>

          {/* Event Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <Text style={styles.description}>
              {event.description || event.shortDescription || 'No description available'}
            </Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {new Date(event.startDate).toLocaleDateString()} • {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {event.endDate && (
                    <Text style={styles.detailValueSecondary}>
                      Until: {new Date(event.endDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={20} color="#3b82f6" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>
                    {event.venueName || 'Venue TBA'}
                  </Text>
                  {event.city && event.country && (
                    <Text style={styles.detailValueSecondary}>
                      {event.city}, {event.country}
                    </Text>
                  )}
                </View>
              </View>

              {event.capacity && (
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={20} color="#3b82f6" />
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Capacity</Text>
                    <Text style={styles.detailValue}>
                      {event.capacity} people
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={20} color="#3b82f6" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={[styles.detailValue, styles.price]}>
                    {event.isFree || !event.priceFrom
                      ? 'FREE'
                      : `${event.currency || 'AED'} ${Number(event.priceFrom).toFixed(2)}`}
                  </Text>
                  {event.priceTo && event.priceFrom !== event.priceTo && (
                    <Text style={styles.detailValueSecondary}>
                      Up to {event.currency || 'AED'} {Number(event.priceTo).toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Map */}
          {event.latitude && event.longitude && (
            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>Location on Map</Text>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: event.latitude,
                    longitude: event.longitude,
                  }}
                  title={event.venueName || event.title}
                  description={event.address}
                />
              </MapView>
            </View>
          )}

          {/* Address */}
          {event.address && (
            <View style={styles.addressSection}>
              <Text style={styles.sectionTitle}>Address</Text>
              <Text style={styles.addressText}>{event.address}</Text>
            </View>
          )}

          {/* External Link */}
          {event.externalUrl && (
            <TouchableOpacity
              style={styles.externalLinkButton}
              onPress={() => Linking.openURL(getPlatinumlistUrl(event.externalUrl)).catch(() =>
                Alert.alert('Error', 'Unable to open link.')
              )}
            >
              <Ionicons name="link-outline" size={20} color="#3b82f6" />
              <Text style={styles.externalLinkText}>
                View on {isPlatinumlistUrl(event.externalUrl) ? 'Platinumlist' : (event.externalSource || 'Website')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarPrice}>
            {event.isFree || !event.priceFrom
              ? 'FREE'
              : `${event.currency || 'AED'} ${Number(event.priceFrom).toFixed(2)}`}
          </Text>
          {event.capacity && (
            <Text style={styles.bottomBarTickets}>Capacity: {event.capacity}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookTicket}
        >
          <Text style={styles.bookButtonText}>
            {isPlatinumlistUrl(event.externalUrl)
              ? 'Book on Platinumlist'
              : event.externalUrl
              ? 'Book on Website'
              : 'Book Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 380,
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 20,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  eventHeader: {
    marginBottom: 24,
  },
  eventCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCategory: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  featuredBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  eventOrganizer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  organizerName: {
    fontSize: 16,
    color: '#6b7280',
  },
  detailsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  detailValueSecondary: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  price: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  mapSection: {
    marginBottom: 32,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  addressSection: {
    marginBottom: 32,
  },
  addressText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 100,
  },
  externalLinkText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  tagsSection: {
    marginBottom: 32,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#4b5563',
  },
  similarEventsSection: {
    marginBottom: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  bottomBarTickets: {
    fontSize: 12,
    color: '#6b7280',
  },
  bookButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventDetailScreen;