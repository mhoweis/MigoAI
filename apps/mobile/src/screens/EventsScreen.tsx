// migo-mobile/src/screens/EventsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DateRangePickerModal from '../components/DateRangePickerModal';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { consumePendingEventsFilter } from '../navigation/pendingEventsFilter';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Event } from '@migo/shared';
import { useUserStore } from '../store/userStore';
import { useSavedEventsStore } from '../store/savedEventsStore';

// Event categories for filtering
const EVENT_CATEGORIES = [
  'All',
  'Music',
  'Sports',
  'Tech',
  'Art',
  'Food',
  'Business',
  'Networking',
  'Education',
  'Health',
  'Other'
];

const EventsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { userLocation } = useUserStore();
  const { savedIds, toggleSaved, loadSavedEvents } = useSavedEventsStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  // Track whether we've already seeded selectedCity from the user's home-screen location
  const cityInitialized = useRef(false);
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
  const [availableCities, setAvailableCities] = useState<Array<{ name: string; count: number }>>([]);
  const [availableVenues, setAvailableVenues] = useState<Array<{ name: string; count: number }>>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  // Dynamic filter options based on current selection
  const [dynamicCities, setDynamicCities] = useState<Array<{ name: string; count: number }>>([]);
  const [dynamicVenues, setDynamicVenues] = useState<Array<{ name: string; count: number }>>([]);
  const [dynamicCategories, setDynamicCategories] = useState<Array<{ name: string; count: number }>>([]);
  // venueFilter: set when navigating from Home's Top Venues section
  const [venueFilter, setVenueFilter] = useState<string>(route.params?.venueFilter || '');
  // dateFilter: set when navigating from AI Chat or via quick presets
  const [dateFrom, setDateFrom] = useState<string>(route.params?.dateFrom || '');
  const [dateTo, setDateTo] = useState<string>(route.params?.dateTo || '');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleShare = async (item: Event) => {
    try {
      await Share.share({
        message: `Check out "${item.title}" on Migo!\n${item.venueName || item.city || ''} — ${new Date(item.startDate).toLocaleDateString()}`,
      });
    } catch {}
  };

  // Helper function to normalize venue names for comparison
  const normalizeVenueName = (venueName: string | null | undefined): string => {
    if (!venueName) return '';
    return venueName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  };

  // Fetch events when selected city changes
  useEffect(() => {
    fetchEvents();
  }, [selectedCity]);

  // Load available cities, venues, and saved events once on mount
  useEffect(() => {
    loadAvailableCities();
    loadAvailableVenues();
    loadSavedEvents();
  }, []);

  const loadAvailableCities = async () => {
    try {
      console.log('Fetching available cities for EventsScreen...');
      const response = await api.get('/events/filters/quick');
      console.log('Cities API response:', response.data);

      if (response.data.success && response.data.data?.cities) {
        // Add "All Cities" option at the beginning
        const cities = [{ name: 'All Cities', count: 0 }, ...response.data.data.cities];
        console.log('Setting cities:', cities);
        setAvailableCities(cities);
      } else {
        console.log('No cities in response, using fallback');
        // Fallback to default UAE cities if API returns no cities
        setAvailableCities([
          { name: 'All Cities', count: 0 },
          { name: 'Dubai', count: 0 },
          { name: 'Abu Dhabi', count: 0 },
          { name: 'Sharjah', count: 0 },
          { name: 'Ajman', count: 0 },
          { name: 'Ras Al Khaimah', count: 0 },
          { name: 'Fujairah', count: 0 },
          { name: 'Umm Al Quwain', count: 0 },
        ]);
      }
    } catch (error) {
      console.error('Error loading available cities:', error);
      // Fallback to default UAE cities if API fails
      setAvailableCities([
        { name: 'All Cities', count: 0 },
        { name: 'Dubai', count: 0 },
        { name: 'Abu Dhabi', count: 0 },
        { name: 'Sharjah', count: 0 },
        { name: 'Ajman', count: 0 },
        { name: 'Ras Al Khaimah', count: 0 },
        { name: 'Fujairah', count: 0 },
        { name: 'Umm Al Quwain', count: 0 },
      ]);
    }
  };

  const loadAvailableVenues = async () => {
    try {
      console.log('Fetching available venues for EventsScreen...');
      const response = await api.get('/events/filters/quick');
      console.log('Venues API response:', response.data);

      if (response.data.success && response.data.data?.venues) {
        // Add "All Venues" option at the beginning
        const venues = [{ name: 'All Venues', count: 0 }, ...response.data.data.venues];
        console.log('Setting venues:', venues);
        setAvailableVenues(venues);
      } else {
        console.log('No venues in response');
        setAvailableVenues([{ name: 'All Venues', count: 0 }]);
      }
    } catch (error) {
      console.error('Error loading available venues:', error);
      setAvailableVenues([{ name: 'All Venues', count: 0 }]);
    }
  };

  // Sync venueFilter from route params whenever navigation passes new params
  useEffect(() => {
    if (route.params?.venueFilter !== undefined) {
      setVenueFilter(route.params.venueFilter);
      // Show filters when navigating with venue filter
      if (route.params.venueFilter) {
        setFiltersVisible(true);
      }
    }
  }, [route.params?.venueFilter]);

  // Sync dateFrom/dateTo from route params (e.g. navigated from Chat's "View All")
  useEffect(() => {
    if (route.params?.dateFrom !== undefined) {
      setDateFrom(route.params.dateFrom);
    }
    if (route.params?.dateTo !== undefined) {
      setDateTo(route.params.dateTo);
    }
  }, [route.params?.dateFrom, route.params?.dateTo]);

  // Consume pending date filter set by ChatScreen's "View All" button.
  // useFocusEffect runs every time this screen comes into focus.
  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingEventsFilter();
      if (pending) {
        setDateFrom(pending.dateFrom);
        setDateTo(pending.dateTo);
      }
    }, [])
  );

  // Seed selectedCity from the user's home-screen location (runs once when userLocation loads)
  useEffect(() => {
    if (userLocation && !cityInitialized.current) {
      setSelectedCity(userLocation);
      cityInitialized.current = true;
    }
  }, [userLocation]);

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, selectedCategory, sortBy, venueFilter, dateFrom, dateTo]);

  // Update dynamic filter options based on current filters
  useEffect(() => {
    updateDynamicFilters();
  }, [events, dateFrom, dateTo, selectedCity, selectedCategory, venueFilter, searchQuery]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch events filtered by selected city (or all cities)
      const params: any = {
        limit: 200,
      };

      // Only add city filter if a specific city is selected (not "All Cities")
      if (selectedCity && selectedCity !== 'All Cities') {
        params.city = selectedCity;
      }

      const response = await api.get('/events', {
        params,
      });

      console.log('Events API response:', response.data);

      if (response.data.success) {
        // Backend returns: { success: true, data: { events: [...], pagination: {...} } }
        const eventsData = response.data.data?.events || response.data.data;

        // Ensure we have an array
        if (Array.isArray(eventsData)) {
          // Filter out fully-past events: keep events that start today or later,
          // or events that have already started but still have a future end date.
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const currentEvents = eventsData.filter((event: any) => {
            const start = new Date(event.startDate);
            const end = event.endDate ? new Date(event.endDate) : null;
            if (start >= todayStart) return true;
            if (end && end >= todayStart) return true;
            return false;
          });
          setEvents(currentEvents);
        } else {
          console.error('Events data is not an array:', eventsData);
          setEvents([]);
        }
      } else {
        console.error('API returned success: false');
        setEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const updateDynamicFilters = () => {
    if (!Array.isArray(events)) return;

    let filtered = [...events];

    // Apply date range filter
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom).getTime() : null;
      const to = dateTo ? new Date(dateTo).getTime() : null;
      filtered = filtered.filter(event => {
        const eventTime = new Date(event.startDate).getTime();
        if (from && to) return eventTime >= from && eventTime <= to;
        if (from) return eventTime >= from;
        if (to) return eventTime <= to;
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.venueName && event.venueName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.city && event.city.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply city filter (for calculating dynamic venues and categories)
    if (selectedCity && selectedCity !== 'All Cities') {
      filtered = filtered.filter(event => event.city === selectedCity);
    }

    // Apply venue filter (for calculating dynamic cities and categories)
    if (venueFilter.trim()) {
      const normalizedVenueFilter = normalizeVenueName(venueFilter);
      filtered = filtered.filter(event =>
        normalizeVenueName(event.venueName) === normalizedVenueFilter
      );
    }

    // Apply category filter (for calculating dynamic cities and venues)
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Calculate available cities from filtered events (excluding the currently selected city)
    const cityMap = new Map<string, number>();
    filtered.forEach(event => {
      if (event.city && event.city !== selectedCity) {
        cityMap.set(event.city, (cityMap.get(event.city) || 0) + 1);
      }
    });
    const cities = Array.from(cityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    setDynamicCities(cities);

    // Calculate available venues from filtered events (excluding the currently selected venue)
    const venueMap = new Map<string, number>();
    const normalizedCurrentVenue = normalizeVenueName(venueFilter);
    filtered.forEach(event => {
      if (event.venueName && normalizeVenueName(event.venueName) !== normalizedCurrentVenue) {
        venueMap.set(event.venueName, (venueMap.get(event.venueName) || 0) + 1);
      }
    });
    const venues = Array.from(venueMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    setDynamicVenues(venues);

    // Calculate available categories from filtered events (excluding the currently selected category)
    const categoryMap = new Map<string, number>();
    filtered.forEach(event => {
      if (event.category && event.category !== selectedCategory) {
        categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1);
      }
    });
    const categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    setDynamicCategories(categories);
  };

  const applyFilters = () => {
    // Ensure events is an array before spreading
    if (!Array.isArray(events)) {
      console.error('Events is not an array:', events);
      setFilteredEvents([]);
      return;
    }

    let filtered = [...events];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.venueName && event.venueName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.city && event.city.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply venue filter (set when navigating from Top Venues on HomeScreen)
    if (venueFilter.trim()) {
      const normalizedVenueFilter = normalizeVenueName(venueFilter);
      filtered = filtered.filter(event => {
        return normalizeVenueName(event.venueName) === normalizedVenueFilter;
      });

      // Debug logging
      console.log('Venue filter active:', venueFilter);
      console.log('Normalized venue filter:', normalizedVenueFilter);
      console.log('Events after venue filter:', filtered.length);
      if (filtered.length === 0) {
        console.log('Available venues in events:', events.map(e => e.venueName).filter(Boolean));
      }
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom).getTime() : null;
      const to = dateTo ? new Date(dateTo).getTime() : null;
      filtered = filtered.filter(event => {
        const eventTime = new Date(event.startDate).getTime();
        if (from && to) return eventTime >= from && eventTime <= to;
        if (from) return eventTime >= from;
        if (to) return eventTime <= to;
        return true;
      });
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event =>
        event.category === selectedCategory
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else {
        return (a.priceFrom || 0) - (b.priceFrom || 0);
      }
    });

    setFilteredEvents(filtered);
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
    return 'calendar';
  };

  // ---- Date preset helpers ----
  const applyDatePreset = (preset: 'today' | 'tomorrow' | 'weekend' | 'clear') => {
    if (preset === 'clear') {
      setDateFrom('');
      setDateTo('');
      return;
    }
    const today = new Date();
    if (preset === 'today') {
      const start = new Date(today); start.setHours(0, 0, 0, 0);
      const end = new Date(today); end.setHours(23, 59, 59, 999);
      setDateFrom(start.toISOString());
      setDateTo(end.toISOString());
    } else if (preset === 'tomorrow') {
      const tom = new Date(today); tom.setDate(today.getDate() + 1);
      const start = new Date(tom); start.setHours(0, 0, 0, 0);
      const end = new Date(tom); end.setHours(23, 59, 59, 999);
      setDateFrom(start.toISOString());
      setDateTo(end.toISOString());
    } else if (preset === 'weekend') {
      const day = today.getDay(); // 0=Sun,5=Fri,6=Sat
      let daysToFri: number;
      if (day === 5) daysToFri = 0;
      else if (day === 6) daysToFri = -1;
      else if (day === 0) daysToFri = -2;
      else daysToFri = 5 - day;
      const fri = new Date(today); fri.setDate(today.getDate() + daysToFri); fri.setHours(0, 0, 0, 0);
      const sun = new Date(fri); sun.setDate(fri.getDate() + 2); sun.setHours(23, 59, 59, 999);
      setDateFrom(fri.toISOString());
      setDateTo(sun.toISOString());
    }
  };

  const isPresetActive = (preset: 'today' | 'tomorrow' | 'weekend'): boolean => {
    if (!dateFrom) return false;
    const from = new Date(dateFrom);
    const to = dateTo ? new Date(dateTo) : null;
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (preset === 'today') {
      return from.toDateString() === today.toDateString() &&
        (!to || to.toDateString() === today.toDateString());
    }
    if (preset === 'tomorrow') {
      return from.toDateString() === tomorrow.toDateString() &&
        (!to || to.toDateString() === tomorrow.toDateString());
    }
    if (preset === 'weekend') {
      // Active when dateFrom is a Friday
      return from.getDay() === 5;
    }
    return false;
  };

  const getActiveDateLabel = (): string => {
    if (!dateFrom && !dateTo) return '';
    const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (dateFrom && dateTo) return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
    if (dateFrom) return `From ${fmt(dateFrom)}`;
    return `Until ${fmt(dateTo)}`;
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const priceDisplay = item.isFree || !item.priceFrom ? (
      <Text style={styles.eventPrice}>FREE</Text>
    ) : (
      <View style={styles.priceContainerList}>
        <Text style={styles.priceStartingList}>Starting </Text>
        <Text style={styles.eventPrice}>
          {item.currency || 'AED'} {Number(item.priceFrom).toFixed(0)}
        </Text>
      </View>
    );

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        {/* Event Image with overlay buttons */}
        <View style={styles.eventCardImageContainer}>
          {item.coverImage || item.thumbnail ? (
            <Image
              source={{ uri: item.coverImage || item.thumbnail }}
              style={styles.eventCardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.eventCardImage, styles.placeholderImageList]}>
              <Ionicons name="image-outline" size={48} color="#d1d5db" />
            </View>
          )}
          {/* Save & Share overlay */}
          <View style={styles.imageOverlayButtons}>
            <TouchableOpacity
              style={styles.imageActionBtn}
              onPress={() => toggleSaved(item)}
            >
              <Ionicons
                name={savedIds.has(item.id) ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageActionBtn}
              onPress={() => handleShare(item)}
            >
              <Ionicons name="share-social-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.eventCardContent}>
          <View style={styles.eventHeader}>
            <View style={styles.categoryBadge}>
              <Ionicons name={getCategoryIcon(item.category || '')} size={14} color="#3b82f6" />
              <Text style={styles.categoryText}>{item.category || 'Event'}</Text>
            </View>
            {item.locationType === 'ONLINE' && (
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}
          </View>

          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description || item.shortDescription || 'No description available'}
          </Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {new Date(item.startDate).toLocaleDateString()} • {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{item.city || item.venueName || 'Location TBA'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{item.capacity ? `${item.capacity} capacity` : 'Venue'}</Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            {priceDisplay}
            <TouchableOpacity
              style={styles.rsvpButton}
              onPress={() => (navigation as any).navigate('EventDetail', { eventId: item.id })}
            >
              <Text style={styles.rsvpButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCityFilter = () => {
    // Get count for each city from dynamic filters
    const getCityCount = (cityName: string) => {
      if (cityName === 'All Cities') return 0;
      const city = dynamicCities.find(c => c.name === cityName);
      return city ? city.count : 0;
    };

    return (
      <View style={styles.cityFilterContainer}>
        <FlatList
          horizontal
          data={availableCities}
          keyExtractor={(item) => item.name}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityChipsContainer}
          renderItem={({ item }) => {
            const count = getCityCount(item.name);
            const isDisabled = count === 0 && item.name !== 'All Cities' && item.name !== selectedCity;

            return (
              <TouchableOpacity
                style={[
                  styles.cityChip,
                  selectedCity === item.name && styles.cityChipSelected,
                  isDisabled && styles.cityChipDisabled
                ]}
                onPress={() => !isDisabled && setSelectedCity(item.name)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.cityChipText,
                    selectedCity === item.name && styles.cityChipTextSelected,
                    isDisabled && styles.cityChipTextDisabled
                  ]}
                >
                  {item.name}
                  {count > 0 && (
                    <Text style={styles.cityChipCount}> ({count})</Text>
                  )}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  const renderVenueFilter = () => {
    // Get count for each venue from dynamic filters
    const getVenueCount = (venueName: string) => {
      if (venueName === 'All Venues') return 0;
      const venue = dynamicVenues.find(v => v.name === venueName);
      return venue ? venue.count : 0;
    };

    return (
      <View style={styles.venueFilterContainer}>
        <FlatList
          horizontal
          data={availableVenues}
          keyExtractor={(item) => item.name}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.venueChipsContainer}
          renderItem={({ item }) => {
            const count = getVenueCount(item.name);
            const isSelected = venueFilter === item.name || (item.name === 'All Venues' && !venueFilter);
            const isDisabled = count === 0 && item.name !== 'All Venues' && item.name !== venueFilter;

            return (
              <TouchableOpacity
                style={[
                  styles.venueChip,
                  isSelected && styles.venueChipSelected,
                  isDisabled && styles.venueChipDisabled
                ]}
                onPress={() => !isDisabled && setVenueFilter(item.name === 'All Venues' ? '' : item.name)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.venueChipText,
                    isSelected && styles.venueChipTextSelected,
                    isDisabled && styles.venueChipTextDisabled
                  ]}
                >
                  {item.name}
                  {count > 0 && (
                    <Text style={styles.venueChipCount}> ({count})</Text>
                  )}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  const renderCategoryFilter = () => {
    // Get count for each category from dynamic filters
    const getCategoryCount = (categoryName: string) => {
      if (categoryName === 'All') return 0;
      const category = dynamicCategories.find(c => c.name === categoryName);
      return category ? category.count : 0;
    };

    return (
      <FlatList
        horizontal
        data={EVENT_CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilterList}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => {
          const count = getCategoryCount(item);
          const isSelected = selectedCategory === item;
          const isDisabled = count === 0 && item !== 'All' && item !== selectedCategory;

          return (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
                isDisabled && styles.categoryChipDisabled
              ]}
              onPress={() => !isDisabled && setSelectedCategory(item)}
              disabled={isDisabled}
            >
              <Ionicons
                name={getCategoryIcon(item)}
                size={14}
                color={isSelected ? '#fff' : isDisabled ? '#d1d5db' : '#3b82f6'}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextSelected,
                  isDisabled && styles.categoryChipTextDisabled
                ]}
              >
                {item}
                {count > 0 && <Text style={styles.categoryChipCount}> ({count})</Text>}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  const renderDateFilter = () => {
    const isCustomActive = !!(dateFrom || dateTo) &&
      !isPresetActive('today') && !isPresetActive('tomorrow') && !isPresetActive('weekend');

    const dateOptions = [
      { key: 'today', label: 'Today', preset: 'today' as const },
      { key: 'tomorrow', label: 'Tomorrow', preset: 'tomorrow' as const },
      { key: 'weekend', label: 'This Weekend', preset: 'weekend' as const },
      { key: 'custom', label: 'Custom', preset: null },
    ];

    return (
      <View style={styles.dateFilterContainer}>
        <FlatList
          horizontal
          data={dateOptions}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateChipsContainer}
          renderItem={({ item }) => {
            const active = item.preset ? isPresetActive(item.preset) : isCustomActive;
            return (
              <TouchableOpacity
                style={[styles.dateChip, active && styles.dateChipActive]}
                onPress={() => item.preset ? applyDatePreset(active ? 'clear' : item.preset) : setDatePickerVisible(true)}
              >
                <Ionicons
                  name={item.key === 'custom' ? 'options-outline' : 'calendar-outline'}
                  size={13}
                  color={active ? '#fff' : '#6b7280'}
                />
                <Text style={[styles.dateChipText, active && styles.dateChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
        {(dateFrom || dateTo) && (
          <TouchableOpacity style={styles.dateChipClear} onPress={() => applyDatePreset('clear')}>
            <Ionicons name="close-circle" size={15} color="#ef4444" />
            <Text style={styles.dateChipClearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <TouchableOpacity
        style={[
          styles.sortButton,
          sortBy === 'date' && styles.sortButtonActive
        ]}
        onPress={() => setSortBy('date')}
      >
        <Text
          style={[
            styles.sortButtonText,
            sortBy === 'date' && styles.sortButtonTextActive
          ]}
        >
          Date
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.sortButton,
          sortBy === 'price' && styles.sortButtonActive
        ]}
        onPress={() => setSortBy('price')}
      >
        <Text
          style={[
            styles.sortButtonText,
            sortBy === 'price' && styles.sortButtonTextActive
          ]}
        >
          Price
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Events</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFiltersVisible(!filtersVisible)}
        >
          <Ionicons
            name={
              selectedCategory !== 'All' ||
              venueFilter ||
              dateFrom ||
              dateTo ||
              searchQuery ||
              selectedCity !== 'All Cities'
                ? "options"
                : "options-outline"
            }
            size={24}
            color="#3b82f6"
          />
        </TouchableOpacity>
      </View>

      {/* Venue filter banner — shown when navigated from Top Venues */}
      {!!venueFilter && (
        <View style={styles.venueBanner}>
          <Ionicons name="location" size={16} color="#1d4ed8" />
          <Text style={styles.venueBannerText} numberOfLines={1}>
            Showing events at <Text style={styles.venueBannerName}>{venueFilter}</Text>
          </Text>
          <TouchableOpacity onPress={() => setVenueFilter('')}>
            <Ionicons name="close-circle" size={18} color="#1d4ed8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Date filter banner — shown when a date/range filter is active */}
      {!!(dateFrom || dateTo) && (
        <View style={styles.dateBanner}>
          <Ionicons name="calendar" size={16} color="#7c3aed" />
          <Text style={styles.dateBannerText} numberOfLines={1}>
            Events: <Text style={styles.dateBannerRange}>{getActiveDateLabel()}</Text>
          </Text>
          <TouchableOpacity onPress={() => { setDateFrom(''); setDateTo(''); }}>
            <Ionicons name="close-circle" size={18} color="#7c3aed" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, locations, categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          textContentType="none"
          editable={true}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options - Outside filters */}
      {renderSortOptions()}

      {/* Filters Section - Toggle visibility */}
      {filtersVisible && (
        <View style={styles.filtersSection}>
          {/* Date Quick-Filter */}
          {renderDateFilter()}

          {/* City Filter */}
          {renderCityFilter()}

          {/* Venue Filter */}
          {renderVenueFilter()}

          {/* Category Filters */}
          {renderCategoryFilter()}
        </View>
      )}

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptyText}>
              {(dateFrom || dateTo)
                ? 'No events in this date range. Try a different range.'
                : searchQuery
                ? 'Try a different search'
                : 'Check back later for new events!'}
            </Text>
          </View>
        }
      />

      {/* Custom date range calendar picker */}
      <DateRangePickerModal
        visible={datePickerVisible}
        initialFrom={dateFrom}
        initialTo={dateTo}
        onApply={(from, to) => {
          setDateFrom(from);
          setDateTo(to);
          setDatePickerVisible(false);
        }}
        onClose={() => setDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  venueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  venueBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1d4ed8',
  },
  venueBannerName: {
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterButton: {
    padding: 8,
  },
  filtersSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  cityFilterContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 0,
  },
  cityFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cityFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  cityChipsContainer: {
    paddingVertical: 4,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    marginRight: 8,
  },
  cityChipSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  cityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
  },
  cityChipTextSelected: {
    color: '#fff',
  },
  cityChipCount: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  cityChipDisabled: {
    opacity: 0.4,
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  cityChipTextDisabled: {
    color: '#9ca3af',
  },
  venueFilterContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 0,
  },
  venueChipsContainer: {
    paddingVertical: 4,
  },
  venueChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginRight: 8,
  },
  venueChipSelected: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  venueChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b45309',
  },
  venueChipTextSelected: {
    color: '#fff',
  },
  venueChipCount: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  venueChipDisabled: {
    opacity: 0.4,
    backgroundColor: '#fef9e7',
    borderColor: '#fde68a',
  },
  venueChipTextDisabled: {
    color: '#d97706',
  },
  categoryFilterList: {
    marginBottom: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    height: 36,
    gap: 5,
  },
  categoryChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  categoryChipDisabled: {
    opacity: 0.4,
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  categoryChipTextDisabled: {
    color: '#9ca3af',
  },
  categoryChipCount: {
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  eventsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  eventCardImageContainer: {
    position: 'relative',
  },
  eventCardImage: {
    width: '100%',
    height: 200,
  },
  imageOverlayButtons: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  imageActionBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 7,
  },
  placeholderImageList: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCardContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 100,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  onlineBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainerList: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceStartingList: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '400',
  },
  eventPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  rsvpButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rsvpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingTop: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  // Date filter banner
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  dateBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#7c3aed',
  },
  dateBannerRange: {
    fontWeight: '700',
  },
  // Date quick-filter row
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  dateChipsContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dateChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  dateChipTextActive: {
    color: '#fff',
  },
  dateChipClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dateChipClearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default EventsScreen;