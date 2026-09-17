// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store/userStore';
import { useSavedEventsStore } from '../store/savedEventsStore';
import { useWalletStore } from '../store/walletStore';
import { Event } from '@migo/shared';
import { api } from '../services/api';
import { navigateToTab, navigationRef } from '../navigation/navigationRef';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, userLocation, setUserLocation } = useUserStore();
  const { savedEvents, savedIds, loadSavedEvents, toggleSaved } = useSavedEventsStore();
  const { upcomingTickets, loadTickets } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filteredTopEvents, setFilteredTopEvents] = useState<Event[]>([]);
  const [filteredThisWeek, setFilteredThisWeek] = useState<Event[]>([]);
  const [filteredToday, setFilteredToday] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [availableCities, setAvailableCities] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadEvents();
    loadSavedEvents();
    loadTickets();
  }, [user?.interests, userLocation]);

  useEffect(() => {
    loadAvailableCities();
  }, []);

  const loadAvailableCities = async () => {
    try {
      console.log('Fetching available cities...');
      const response = await api.get('/events/filters/quick');
      console.log('Cities API response:', response.data);

      if (response.data.success && response.data.data?.cities) {
        const cities = response.data.data.cities;
        console.log('Setting cities:', cities);
        setAvailableCities(cities);
      } else {
        console.log('No cities in response, using fallback');
        // Fallback to default UAE cities if API returns no cities
        setAvailableCities([
          { name: 'Dubai', count: 0 },
          { name: 'Abu Dhabi', count: 0 },
          { name: 'Sharjah', count: 0 },
        ]);
      }
    } catch (error) {
      console.error('Error loading available cities:', error);
      // Fallback to default UAE cities if API fails
      setAvailableCities([
        { name: 'Dubai', count: 0 },
        { name: 'Abu Dhabi', count: 0 },
        { name: 'Sharjah', count: 0 },
      ]);
    }
  };

  // Filter events happening on today's date
  const getTodayEvents = (events: Event[]): Event[] => {
    const today = new Date();
    return events.filter((event: Event) => {
      const d = new Date(event.startDate);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    });
  };

  // Filter events from today to end of current week (Sunday).
  // If today IS Sunday, the range extends to next Sunday.
  const getThisWeekEvents = (events: Event[]): Event[] => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const dayOfWeek = start.getDay(); // 0 = Sun, 1 = Mon … 6 = Sat
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;

    const end = new Date(start);
    end.setDate(start.getDate() + daysUntilSunday);
    end.setHours(23, 59, 59, 999);

    return events.filter((event: Event) => {
      const d = new Date(event.startDate);
      return d >= start && d <= end;
    });
  };

  // Share an event via the native share sheet
  const handleShare = async (event: Event) => {
    try {
      const date = new Date(event.startDate).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      });
      await Share.share({
        message: `Check out "${event.title}" on ${date}${event.city ? ` in ${event.city}` : ''}! 🎉`,
        title: event.title,
      });
    } catch {}
  };

  const loadEvents = async () => {
    try {
      setRefreshing(true);

      // Fetch events filtered by user's location (default: Dubai)
      const response = await api.get('/events', {
        params: {
          city: userLocation || 'Dubai',
          limit: 200,
        },
      });

      if (response.data.success) {
        const fetchedEvents = response.data.data?.events || [];

        // Apply interest filtering if user has interests
        let filtered = fetchedEvents;
        if (user?.interests && user.interests.length > 0) {
          filtered = fetchedEvents.filter((event: Event) =>
            user.interests.some((interest: string) =>
              event.category?.toLowerCase().includes(interest.toLowerCase())
            )
          );
        }

        setAllEvents(filtered);
        setFilteredEvents(filtered);
        setFilteredTopEvents(filtered.slice(0, 10));
        setFilteredThisWeek(getThisWeekEvents(filtered));
        setFilteredToday(getTodayEvents(filtered));
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setFilteredEvents([]);
      setFilteredTopEvents([]);
      setFilteredThisWeek([]);
      setFilteredToday([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    await loadEvents();
  };

  // Function to navigate to Events tab
  const navigateToEvents = () => {
    navigateToTab('Events');
  };

  // Function to navigate to Events with filter
  const navigateToEventsWithFilter = (filter: string) => {
    navigateToTab('Events', 'EventsMain', { filter });
  };

  // Handle interest pill selection — filters all event sections on HomeScreen
  const handleInterestSelect = (interest: string) => {
    const next = selectedInterest === interest ? null : interest;
    setSelectedInterest(next);
    const base = next
      ? allEvents.filter((e: Event) =>
          e.category?.toLowerCase().includes(next.toLowerCase())
        )
      : allEvents;
    setFilteredEvents(base);
    setFilteredTopEvents(base.slice(0, 10));
    setFilteredThisWeek(getThisWeekEvents(base));
    setFilteredToday(getTodayEvents(base));
  };

  // Reset interest filter to show all events
  const handleResetFilter = () => {
    setSelectedInterest(null);
    setFilteredEvents(allEvents);
    setFilteredTopEvents(allEvents.slice(0, 10));
    setFilteredThisWeek(getThisWeekEvents(allEvents));
    setFilteredToday(getTodayEvents(allEvents));
  };

  // Derive top venues from allEvents (sorted by event count)
  const topVenues = React.useMemo(() => {
    interface VenueInfo { name: string; image?: string; city: string; count: number }
    const map = new Map<string, VenueInfo>();
    allEvents.forEach((event: Event) => {
      if (!event.venueName) return;
      const existing = map.get(event.venueName);
      if (existing) {
        existing.count++;
        if (!existing.image) existing.image = event.coverImage || event.thumbnail;
      } else {
        map.set(event.venueName, {
          name: event.venueName,
          image: event.coverImage || event.thumbnail,
          city: event.city || '',
          count: 1,
        });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [allEvents]);

  // Navigate to EventsScreen filtered by a specific venue
  const navigateToVenue = (venueName: string) => {
    navigateToTab('Events', 'EventsMain', { venueFilter: venueName });
  };

  // Helper function to get category icon
  const getCategoryIcon = (category: string): any => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('music') || cat.includes('concert')) return 'musical-notes';
    if (cat.includes('sport')) return 'football';
    if (cat.includes('art') || cat.includes('exhibition')) return 'color-palette';
    if (cat.includes('food') || cat.includes('drink')) return 'restaurant';
    if (cat.includes('tech') || cat.includes('business')) return 'briefcase';
    if (cat.includes('family') || cat.includes('kids')) return 'people';
    if (cat.includes('theater') || cat.includes('comedy')) return 'mic';
    if (cat.includes('health') || cat.includes('wellness')) return 'fitness';
    if (cat.includes('education') || cat.includes('learning')) return 'school';
    if (cat.includes('network')) return 'people-circle';
    return 'calendar';
  };

  const renderTopEventCard = ({ item }: { item: Event }) => {
    const eventDate = new Date(item.startDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const saved = savedIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.topEventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.topEventImage} />
        ) : (
          <View style={[styles.topEventImage, styles.placeholderImageTop]}>
            <Ionicons name="image-outline" size={48} color="#d1d5db" />
          </View>
        )}
        <View style={styles.topEventOverlay}>
          {/* Top row: badge + action buttons */}
          <View style={styles.topEventTopRow}>
            <View style={styles.topEventBadge}>
              <Text style={styles.topEventBadgeText}>FEATURED</Text>
            </View>
            <View style={styles.topEventActions}>
              <TouchableOpacity
                style={styles.topEventActionBtn}
                onPress={() => toggleSaved(item)}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={saved ? '#facc15' : '#fff'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.topEventActionBtn}
                onPress={() => handleShare(item)}
              >
                <Ionicons name="share-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.topEventContent}>
            <Text style={styles.topEventTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.topEventMeta}>
              <Ionicons name="calendar-outline" size={12} color="#fff" />
              <Text style={styles.topEventMetaText}>
                {formattedDate} • {formattedTime}
              </Text>
            </View>
            <View style={styles.topEventMeta}>
              <Ionicons name="location-outline" size={12} color="#fff" />
              <Text style={styles.topEventMetaText}>
                {item.city}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventCard = (item: Event, isToday = false) => {
    const eventDate = new Date(item.startDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Format price with "Starting from" text
    const priceDisplay = item.isFree || !item.priceFrom ? (
      <Text style={styles.eventPrice}>FREE</Text>
    ) : (
      <View style={styles.priceContainer}>
        <Text style={styles.priceStarting}>Starting </Text>
        <Text style={styles.eventPrice}>
          {item.currency || 'AED'} {Number(item.priceFrom).toFixed(0)}
        </Text>
      </View>
    );

    const saved = savedIds.has(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.eventCard, isToday && styles.todayEventCard]}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        {item.coverImage || item.thumbnail ? (
          <Image source={{ uri: item.coverImage || item.thumbnail }} style={styles.eventImage} />
        ) : (
          <View style={[styles.eventImage, styles.placeholderImageSmall]}>
            <Ionicons name="image-outline" size={32} color="#d1d5db" />
          </View>
        )}
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventCategory}>{item.category || 'Event'}</Text>
          </View>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.eventMeta}>
            <View style={styles.eventMetaItem}>
              <Ionicons name="calendar-outline" size={14} color="#6b7280" />
              <Text style={styles.eventMetaText}>{formattedDate}</Text>
            </View>
            <View style={styles.eventMetaItem}>
              <Ionicons name="location-outline" size={14} color="#6b7280" />
              <Text style={styles.eventMetaText}>{item.city}</Text>
            </View>
          </View>
          <View style={styles.eventFooter}>
            {priceDisplay}
            {!!item.capacity && (
              <View style={styles.eventTickets}>
                <Ionicons name="people-outline" size={14} color="#10b981" />
                <Text style={styles.eventTicketsText}>
                  {item.capacity} capacity
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Save & Share buttons — right side column */}
        <View style={styles.eventCardActions}>
          <TouchableOpacity
            style={styles.eventCardActionBtn}
            onPress={() => toggleSaved(item)}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? '#3b82f6' : '#9ca3af'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.eventCardActionBtn}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="share-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInterestPills = () => {
    if (!user?.interests || user.interests.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.interestsScroll}
        contentContainerStyle={styles.interestsContainer}
      >
        {/* "All" reset pill — always shown first */}
        <TouchableOpacity
          style={[
            styles.interestPill,
            styles.interestPillAll,
            selectedInterest === null && styles.interestPillAllActive,
          ]}
          onPress={handleResetFilter}
        >
          <Ionicons name="apps-outline" size={14} color={selectedInterest === null ? '#fff' : '#3b82f6'} />
          <Text style={[styles.interestPillText, selectedInterest !== null && { color: '#3b82f6' }]}>All</Text>
        </TouchableOpacity>

        {user.interests.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[
              styles.interestPill,
              selectedInterest === interest && styles.interestPillActive,
            ]}
            onPress={() => handleInterestSelect(interest)}
          >
            <Ionicons
              name={getCategoryIcon(interest)}
              size={14}
              color="#fff"
            />
            <Text style={styles.interestPillText}>{interest}</Text>
          </TouchableOpacity>
        ))}

        {/* Update interests button */}
        <TouchableOpacity
          style={styles.editInterestsButton}
          onPress={() => navigation.push('Interests')}
        >
          <Ionicons name="heart-outline" size={16} color="#3b82f6" />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.name?.split(' ')[0] || 'Guest'}! 👋
            </Text>
            <Text style={styles.subtitle}>
              Discover events that match your interests
            </Text>
          </View>
          <TouchableOpacity
            style={styles.locationDisplay}
            onPress={() => setShowLocationModal(true)}
          >
            <Ionicons name="location" size={20} color="#3b82f6" />
            <Text style={styles.locationText}>
              {userLocation || 'Dubai'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#0369a1" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* User Interests */}
        {renderInterestPills()}

        {/* Top 10 Upcoming Events - Horizontal Scroll */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Upcoming Events</Text>
            <TouchableOpacity onPress={navigateToEvents}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={filteredTopEvents}
            renderItem={renderTopEventCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topEventsContainer}
          />
        </View>

        {/* This Week's Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week For You</Text>
            <TouchableOpacity onPress={() => navigateToEventsWithFilter('this-week')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {filteredThisWeek.length > 0 ? (
            filteredThisWeek.map((event) => renderEventCard(event))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>
                No events this week matching your interests
              </Text>
              <TouchableOpacity 
                style={styles.exploreButton}
                onPress={navigateToEvents}
              >
                <Text style={styles.exploreButtonText}>Explore All Events</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Top Venues */}
        {topVenues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Venues</Text>
              <TouchableOpacity onPress={() => navigateToTab('Events')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={topVenues}
              keyExtractor={(item) => item.name}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.venuesContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.venueCard}
                  onPress={() => navigateToVenue(item.name)}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.venueImage} />
                  ) : (
                    <View style={[styles.venueImage, styles.venuePlaceholder]}>
                      <Ionicons name="business-outline" size={32} color="#d1d5db" />
                    </View>
                  )}
                  <View style={styles.venueOverlay}>
                    <Text style={styles.venueName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.venueMetaRow}>
                      {item.city ? (
                        <View style={styles.venueMetaItem}>
                          <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.venueMetaText} numberOfLines={1}>{item.city}</Text>
                        </View>
                      ) : null}
                      <View style={styles.venueEventCount}>
                        <Text style={styles.venueEventCountText}>{item.count} event{item.count !== 1 ? 's' : ''}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Today's Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Picks</Text>
            <View style={styles.todayBadge}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.todayBadgeText}>LIVE</Text>
            </View>
          </View>
          {filteredToday.length > 0 ? (
            filteredToday.map((event) => renderEventCard(event, true))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>
                No events today matching your interests
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Check back tomorrow or explore all events
              </Text>
            </View>
          )}
        </View>

        {/* Your Tickets section — only shown if user has upcoming tickets */}
        {upcomingTickets().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Tickets</Text>
              <TouchableOpacity onPress={() => (navigationRef.current as any)?.navigate('Main', { screen: 'Tabs', params: { screen: 'Wallet' } })}>
                <Text style={styles.seeAll}>View Wallet</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {upcomingTickets().slice(0, 5).map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketPreviewCard}
                  onPress={() => (navigationRef.current as any)?.navigate('Main', { screen: 'Tabs', params: { screen: 'Wallet' } })}
                >
                  <View style={[styles.ticketPreviewTop, { backgroundColor: ticket.category === 'Music' ? '#6d28d9' : ticket.category === 'Sports' ? '#065f46' : '#3b82f6' }]}>
                    <Text style={styles.ticketPreviewCategory}>{ticket.category || 'Event'}</Text>
                    <Text style={styles.ticketPreviewTitle} numberOfLines={2}>{ticket.eventTitle}</Text>
                  </View>
                  <View style={styles.ticketPreviewBottom}>
                    <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                    <Text style={styles.ticketPreviewDate}>
                      {new Date(ticket.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Your Saved Events section */}
        {savedEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Saved Events</Text>
              <TouchableOpacity onPress={() => navigateToTab('Events')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {savedEvents.slice(0, 4).map((event) => renderEventCard(event))}
          </View>
        )}

        {/* AI Assistant Button */}
        <TouchableOpacity
          style={styles.aiAssistantButton}
          onPress={() => navigateToTab('Chat')}
        >
          <View style={styles.aiAssistantIcon}>
            <Ionicons name="sparkles" size={24} color="#fff" />
          </View>
          <View style={styles.aiAssistantText}>
            <Text style={styles.aiAssistantTitle}>Need help finding events?</Text>
            <Text style={styles.aiAssistantSubtitle}>Chat with our AI assistant</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose your preferred city for event discovery
            </Text>

            <ScrollView style={styles.citiesScroll} showsVerticalScrollIndicator={false}>
              {availableCities.map((cityObj) => (
                <TouchableOpacity
                  key={cityObj.name}
                  style={[
                    styles.cityOption,
                    userLocation === cityObj.name && styles.cityOptionSelected,
                  ]}
                  onPress={async () => {
                    await setUserLocation(cityObj.name);
                    setShowLocationModal(false);
                  }}
                >
                  <View style={styles.cityOptionContent}>
                    <Ionicons
                      name="location"
                      size={24}
                      color={userLocation === cityObj.name ? '#3b82f6' : '#6b7280'}
                    />
                    <View style={styles.cityTextContainer}>
                      <Text
                        style={[
                          styles.cityOptionText,
                          userLocation === cityObj.name && styles.cityOptionTextSelected,
                        ]}
                      >
                        {cityObj.name}
                      </Text>
                      <Text style={styles.cityEventCount}>
                        {cityObj.count} {cityObj.count === 1 ? 'event' : 'events'}
                      </Text>
                    </View>
                  </View>
                  {userLocation === cityObj.name && (
                    <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}

              {availableCities.length === 0 && (
                <View style={styles.noCitiesContainer}>
                  <Ionicons name="location-outline" size={48} color="#d1d5db" />
                  <Text style={styles.noCitiesText}>Loading cities...</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginLeft: 4,
  },
  interestsScroll: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  interestsContainer: {
    paddingRight: 20,
    gap: 8,
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  interestPillActive: {
    backgroundColor: '#1d4ed8',
    borderWidth: 2,
    borderColor: '#fff',
  },
  interestPillAll: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  interestPillAllActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  interestPillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editInterestsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAll: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  topEventsContainer: {
    paddingLeft: 20,
    gap: 16,
  },
  topEventCard: {
    width: width * 0.75,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  topEventImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImageTop: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topEventOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
    justifyContent: 'space-between',
  },
  topEventBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topEventBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  topEventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topEventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topEventActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topEventContent: {
    marginTop: 'auto',
  },
  topEventTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  topEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  topEventMetaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginLeft: 6,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayEventCard: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  eventImage: {
    width: 120,
    height: '100%',
  },
  placeholderImageSmall: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCategory: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 22,
  },
  eventMeta: {
    marginBottom: 12,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceStarting: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '400',
  },
  eventPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  eventTickets: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventTicketsText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 4,
    fontWeight: '600',
  },
  eventCardActions: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
  },
  eventCardActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  aiAssistantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  aiAssistantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aiAssistantText: {
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  aiAssistantSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Ticket preview card
  ticketPreviewCard: {
    width: 160,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  ticketPreviewTop: {
    padding: 14,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  ticketPreviewCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ticketPreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  ticketPreviewBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ticketPreviewDate: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  // Top Venues
  venuesContainer: {
    paddingLeft: 20,
    gap: 12,
  },
  venueCard: {
    width: 150,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  venuePlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 12,
    justifyContent: 'flex-end',
  },
  venueName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  venueMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  venueMetaText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
  },
  venueEventCount: {
    backgroundColor: 'rgba(59,130,246,0.85)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  venueEventCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  citiesScroll: {
    maxHeight: 400,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  cityOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  cityOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  cityOptionTextSelected: {
    color: '#3b82f6',
  },
  cityEventCount: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  noCitiesContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noCitiesText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
});

export default HomeScreen;