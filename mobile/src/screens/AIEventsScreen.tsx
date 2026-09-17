// src/screens/AIEventsScreen.tsx
// Opened from the AI Chat "View All" button via direct stack navigation.
// Receives dateFrom / dateTo as route params and shows matching events.
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { getPlatinumlistUrl } from '../config/affiliates';
import { useSavedEventsStore } from '../store/savedEventsStore';

// ─── types ───────────────────────────────────────────────────────────────────
export type AIEventsParams = {
  dateFrom?: string;
  dateTo?: string;
  queryLabel?: string; // e.g. "Weekend Events", "Events on Fri 21 Feb"
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatDateRange(from?: string, to?: string): string {
  if (!from && !to) return 'All upcoming events';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short' });
  if (from && to) {
    const f = fmt(from);
    const t = fmt(to);
    return f === t ? f : `${f} – ${t}`;
  }
  return from ? `From ${fmt(from)}` : `Until ${fmt(to!)}`;
}

function getCategoryIcon(category: string): any {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('music') || cat.includes('concert')) return 'musical-notes';
  if (cat.includes('sport')) return 'football';
  if (cat.includes('art') || cat.includes('exhibition')) return 'color-palette';
  if (cat.includes('food') || cat.includes('drink')) return 'restaurant';
  if (cat.includes('tech') || cat.includes('business')) return 'briefcase';
  if (cat.includes('family') || cat.includes('kids')) return 'people';
  if (cat.includes('theater') || cat.includes('comedy')) return 'mic';
  return 'calendar';
}

// ─── component ───────────────────────────────────────────────────────────────
export default function AIEventsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ AIEvents: AIEventsParams }, 'AIEvents'>>();
  const { dateFrom, dateTo, queryLabel } = route.params ?? {};
  const { savedIds, toggleSaved, loadSavedEvents } = useSavedEventsStore();

  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const CATEGORIES = ['All', 'Music', 'Sports', 'Tech', 'Art', 'Food', 'Business', 'Other'];

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/events', { params: { limit: 200 } });
      if (response.data.success) {
        const data = response.data.data?.events ?? response.data.data ?? [];
        setAllEvents(Array.isArray(data) ? data : []);
      } else {
        setAllEvents([]);
      }
    } catch {
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    loadSavedEvents();
  }, []);

  // ── filter ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...allEvents];

    // Date range
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom).getTime() : null;
      const to   = dateTo   ? new Date(dateTo).getTime()   : null;
      result = result.filter(e => {
        const t = new Date(e.startDate).getTime();
        if (from && to) return t >= from && t <= to;
        if (from) return t >= from;
        if (to)   return t <= to;
        return true;
      });
    }

    // Category
    if (selectedCategory !== 'All') {
      result = result.filter(e => e.category === selectedCategory);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.venueName?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q)
      );
    }

    // Sort by date asc
    result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    setFiltered(result);
  }, [allEvents, dateFrom, dateTo, selectedCategory, search]);

  // ── render helpers ─────────────────────────────────────────────────────────
  const handleShare = async (item: any) => {
    try {
      const bookingUrl = getPlatinumlistUrl(item.externalUrl);
      await Share.share({
        message: `Check out "${item.title}" on Platinumlist!\n${item.venueName || item.city || ''} — ${new Date(item.startDate).toLocaleDateString()}\n\n${bookingUrl}`,
      });
    } catch {}
  };

  const renderItem = ({ item }: { item: any }) => {
    const price = item.isFree
      ? 'Free'
      : item.priceFrom != null
      ? `${item.priceFrom} AED`
      : 'Price TBA';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        {/* Image */}
        <View style={styles.imageWrapper}>
          {item.coverImage || item.thumbnail ? (
            <Image
              source={{ uri: item.coverImage || item.thumbnail }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardImage, styles.placeholder]}>
              <Ionicons name="image-outline" size={40} color="#d1d5db" />
            </View>
          )}
          <View style={styles.imageOverlay}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleSaved(item)}>
              <Ionicons
                name={savedIds.has(item.id) ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <View style={styles.categoryRow}>
            <Ionicons name={getCategoryIcon(item.category)} size={13} color="#3b82f6" />
            <Text style={styles.categoryText}>{item.category || 'Event'}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text style={styles.detailText}>
              {new Date(item.startDate).toLocaleDateString('en-AE', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}{' '}
              {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.venueName || item.city || 'Location TBA'}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.price, item.isFree && styles.priceFree]}>{price}</Text>
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
            >
              <Text style={styles.detailsBtnText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const dateLabel = queryLabel ?? formatDateRange(dateFrom, dateTo);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Events</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{dateLabel}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results count */}
      {!loading && (
        <Text style={styles.resultCount}>
          {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
        </Text>
      )}

      {/* Events list */}
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await fetchEvents(); setRefreshing(false); }}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={56} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptyText}>
                {search || selectedCategory !== 'All'
                  ? 'Try adjusting your search or category filter.'
                  : 'No events match the selected date range.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f9fafb' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn:      { padding: 4, marginRight: 12 },
  headerText:   { flex: 1 },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSub:    { fontSize: 12, color: '#6b7280', marginTop: 1 },

  searchRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon:   { marginRight: 8 },
  searchInput:  { flex: 1, fontSize: 15, color: '#111827' },

  categoryContainer: { height: 50 },
  categoryList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', height: 32 },
  catChipActive:{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  catChipText:  { fontSize: 13, color: '#374151', fontWeight: '500' },
  catChipTextActive: { color: '#fff' },

  resultCount:  { paddingHorizontal: 16, paddingBottom: 4, fontSize: 13, color: '#6b7280' },

  listContent:  { paddingHorizontal: 16, paddingBottom: 24 },

  card:         { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, overflow: 'hidden' },
  imageWrapper: { position: 'relative' },
  cardImage:    { width: '100%', height: 180 },
  placeholder:  { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  imageOverlay: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 8 },
  actionBtn:    { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 18, padding: 6 },

  cardBody:     { padding: 14 },
  categoryRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  categoryText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  detailRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailText:   { fontSize: 13, color: '#6b7280', flex: 1 },

  cardFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price:        { fontSize: 15, fontWeight: '700', color: '#111827' },
  priceFree:    { color: '#10b981' },
  detailsBtn:   { backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  detailsBtnText:{ color: '#fff', fontSize: 13, fontWeight: '600' },

  emptyState:   { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyText:    { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
});
