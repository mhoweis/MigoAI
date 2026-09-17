// src/screens/WalletScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore, Ticket } from '../store/walletStore';
import { useUserStore } from '../store/userStore';

const { width } = Dimensions.get('window');
const TICKET_WIDTH = width - 48;

const CATEGORY_COLORS: Record<string, string> = {
  Music: '#6d28d9',
  Sports: '#065f46',
  Art: '#b45309',
  Food: '#dc2626',
  Tech: '#1d4ed8',
  Business: '#374151',
  Health: '#0f766e',
  Theater: '#7c3aed',
  Comedy: '#d97706',
  Other: '#3b82f6',
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const getColor = (category?: string) =>
  CATEGORY_COLORS[category || ''] || CATEGORY_COLORS['Other'];

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return {
    day:   d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    date:  d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    year:  d.getFullYear(),
    time:  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

// ─── Add-Ticket Modal ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  eventTitle: '',
  eventDate: '',
  eventTime: '',
  venueName: '',
  city: '',
  ticketType: '',
  seatInfo: '',
  confirmationCode: '',
  price: '',
  category: 'Other',
};

function AddTicketModal({
  visible,
  holderName,
  onClose,
  onAdd,
}: {
  visible: boolean;
  holderName: string;
  onClose: () => void;
  onAdd: (ticket: Ticket) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState<'method' | 'manual'>('method');

  const set = (k: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.eventTitle.trim()) {
      Alert.alert('Required', 'Please enter the event name.');
      return;
    }
    if (!form.eventDate.trim()) {
      Alert.alert('Required', 'Please enter the event date (YYYY-MM-DD).');
      return;
    }
    if (!form.venueName.trim()) {
      Alert.alert('Required', 'Please enter the venue name.');
      return;
    }

    const dateTimeStr = form.eventTime
      ? `${form.eventDate}T${form.eventTime}`
      : `${form.eventDate}T00:00`;

    const ticket: Ticket = {
      id: `manual-${Date.now()}`,
      eventTitle: form.eventTitle.trim(),
      eventDate: new Date(dateTimeStr).toISOString(),
      venueName: form.venueName.trim(),
      city: form.city.trim(),
      holderName,
      ticketType: form.ticketType.trim() || undefined,
      seatInfo: form.seatInfo.trim() || undefined,
      confirmationCode: form.confirmationCode.trim() || `MIGO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      price: form.price.trim() || undefined,
      category: form.category,
    };

    onAdd(ticket);
    setForm(EMPTY_FORM);
    setStep('method');
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setStep('method');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={modal.container}>
          {/* Header */}
          <View style={modal.header}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={modal.title}>Add Ticket</Text>
            <View style={{ width: 24 }} />
          </View>

          {step === 'method' ? (
            <ScrollView contentContainerStyle={modal.methodList}>
              <Text style={modal.sectionLabel}>How would you like to add your ticket?</Text>

              {/* Manual entry */}
              <TouchableOpacity style={modal.methodCard} onPress={() => setStep('manual')}>
                <View style={[modal.methodIcon, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="create-outline" size={26} color="#3b82f6" />
                </View>
                <View style={modal.methodText}>
                  <Text style={modal.methodTitle}>Enter Manually</Text>
                  <Text style={modal.methodSub}>Type in your ticket details from a confirmation email or booking</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Email instructions */}
              <TouchableOpacity
                style={modal.methodCard}
                onPress={() =>
                  Alert.alert(
                    'Import from Email',
                    'To add a ticket from an email:\n\n1. Open your booking confirmation email\n2. Find the event name, date, venue and confirmation code\n3. Tap "Enter Manually" and fill in those details\n\nFull email scanning coming soon!',
                    [{ text: 'Got it', onPress: () => setStep('manual') }],
                  )
                }
              >
                <View style={[modal.methodIcon, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="mail-outline" size={26} color="#16a34a" />
                </View>
                <View style={modal.methodText}>
                  <Text style={modal.methodTitle}>From Email</Text>
                  <Text style={modal.methodSub}>Import ticket details from your booking confirmation email</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* QR scan placeholder */}
              <TouchableOpacity
                style={[modal.methodCard, { opacity: 0.5 }]}
                onPress={() => Alert.alert('Coming Soon', 'QR code scanning will be available in the next update.')}
              >
                <View style={[modal.methodIcon, { backgroundColor: '#fefce8' }]}>
                  <Ionicons name="qr-code-outline" size={26} color="#ca8a04" />
                </View>
                <View style={modal.methodText}>
                  <Text style={modal.methodTitle}>Scan QR Code</Text>
                  <Text style={modal.methodSub}>Scan a ticket QR code directly — coming soon</Text>
                </View>
                <View style={modal.comingSoon}><Text style={modal.comingSoonText}>Soon</Text></View>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={modal.form} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={modal.backRow} onPress={() => setStep('method')}>
                <Ionicons name="chevron-back" size={16} color="#3b82f6" />
                <Text style={modal.backText}>Back</Text>
              </TouchableOpacity>

              <Field label="Event Name *" value={form.eventTitle} onChange={set('eventTitle')} placeholder="e.g. Coldplay World Tour" />
              <Field label="Date (YYYY-MM-DD) *" value={form.eventDate} onChange={set('eventDate')} placeholder="2025-06-15" keyboardType="numbers-and-punctuation" />
              <Field label="Time (HH:MM)" value={form.eventTime} onChange={set('eventTime')} placeholder="20:00" keyboardType="numbers-and-punctuation" />
              <Field label="Venue *" value={form.venueName} onChange={set('venueName')} placeholder="Coca-Cola Arena" />
              <Field label="City" value={form.city} onChange={set('city')} placeholder="Dubai" />
              <Field label="Ticket Type" value={form.ticketType} onChange={set('ticketType')} placeholder="VIP / General / Front Row" />
              <Field label="Seat / Section" value={form.seatInfo} onChange={set('seatInfo')} placeholder="Block A, Row 3, Seat 12" />
              <Field label="Confirmation Code" value={form.confirmationCode} onChange={set('confirmationCode')} placeholder="ABC123" autoCapitalize="characters" />
              <Field label="Price (optional)" value={form.price} onChange={set('price')} placeholder="250" keyboardType="numeric" />

              {/* Category picker */}
              <Text style={modal.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={modal.catRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[modal.catChip, form.category === cat && { backgroundColor: getColor(cat) }]}
                    onPress={() => setForm((f) => ({ ...f, category: cat }))}
                  >
                    <Text style={[modal.catChipText, form.category === cat && { color: '#fff' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={modal.addBtn} onPress={handleAdd}>
                <Ionicons name="ticket" size={18} color="#fff" />
                <Text style={modal.addBtnText}>Add to Wallet</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType = 'default', autoCapitalize = 'words',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={modal.fieldWrap}>
      <Text style={modal.fieldLabel}>{label}</Text>
      <TextInput
        style={modal.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────
function TicketCard({ ticket, onDelete }: { ticket: Ticket; onDelete: (id: string) => void }) {
  const color = getColor(ticket.category);
  const dt = fmtDate(ticket.eventDate);
  const isPast = new Date(ticket.eventDate) < new Date();

  return (
    <View style={[card.wrapper, isPast && { opacity: 0.6 }]}>
      {/* Coloured header */}
      <View style={[card.top, { backgroundColor: color }]}>
        <View style={card.catBadge}>
          <Text style={card.catText}>{(ticket.category || 'Event').toUpperCase()}</Text>
        </View>
        <Text style={card.title} numberOfLines={2}>{ticket.eventTitle}</Text>
        <View style={card.venueRow}>
          <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={card.venueText} numberOfLines={1}>
            {ticket.venueName}{ticket.city ? `, ${ticket.city}` : ''}
          </Text>
        </View>

        <View style={card.dateRow}>
          <View style={card.dateBlock}>
            <Text style={card.dateDay}>{dt.day}</Text>
            <Text style={card.dateNum}>{dt.date}</Text>
            <Text style={card.dateMon}>{dt.month} {dt.year}</Text>
          </View>
          <View style={card.sep} />
          <View style={card.dateBlock}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={card.dateNum}>{dt.time}</Text>
            <Text style={card.dateMon}>Time</Text>
          </View>
          {ticket.ticketType && (
            <>
              <View style={card.sep} />
              <View style={card.dateBlock}>
                <Ionicons name="ticket-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={card.dateNum} numberOfLines={1}>{ticket.ticketType}</Text>
                <Text style={card.dateMon}>Type</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Perforation */}
      <View style={[card.perf, { backgroundColor: color }]}>
        <View style={card.circleL} />
        <View style={card.dashes}>
          {Array.from({ length: 20 }).map((_, i) => <View key={i} style={card.dash} />)}
        </View>
        <View style={card.circleR} />
      </View>

      {/* White stub */}
      <View style={[card.bottom, { borderColor: color }]}>
        <View style={card.stubRow}>
          <View style={card.stubField}>
            <Text style={card.stubLabel}>HOLDER</Text>
            <Text style={card.stubValue} numberOfLines={1}>{ticket.holderName}</Text>
          </View>
          {ticket.seatInfo && (
            <View style={card.stubField}>
              <Text style={card.stubLabel}>SEAT</Text>
              <Text style={card.stubValue}>{ticket.seatInfo}</Text>
            </View>
          )}
          <View style={card.stubField}>
            <Text style={card.stubLabel}>PRICE</Text>
            <Text style={card.stubValue}>
              {ticket.price ? `AED ${ticket.price}` : 'FREE'}
            </Text>
          </View>
        </View>

        <View style={card.qrRow}>
          <View style={card.qrBox}>
            <Ionicons name="qr-code" size={60} color="#1f2937" />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={card.stubLabel}>CONFIRMATION</Text>
            <Text style={card.confirmCode}>{ticket.confirmationCode}</Text>
            <Text style={[card.stubLabel, { marginTop: 4 }]}>Present at venue entrance</Text>
          </View>
        </View>

        <TouchableOpacity
          style={card.deleteBtn}
          onPress={() =>
            Alert.alert('Remove Ticket', 'Remove this ticket from your wallet?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => onDelete(ticket.id) },
            ])
          }
        >
          <Ionicons name="trash-outline" size={13} color="#ef4444" />
          <Text style={card.deleteTxt}>Remove ticket</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function WalletScreen({ navigation }: any) {
  const { user } = useUserStore();
  const { tickets, loadTickets, addTicket, removeTicket, upcomingTickets } = useWalletStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadTickets(); }, []);

  const upcoming = upcomingTickets();
  const past = tickets.filter((t) => new Date(t.eventDate) < new Date());
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>My Wallet</Text>
          <Text style={s.headerSub}>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['upcoming', 'past'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
              {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tip banner */}
      {tickets.length === 0 && (
        <View style={s.tipBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
          <Text style={s.tipText}>
            Tap <Text style={{ fontWeight: '700' }}>+</Text> to add tickets from the app, an email confirmation, or enter them manually.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {displayed.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="ticket-outline" size={72} color="#d1d5db" />
            <Text style={s.emptyTitle}>
              {tab === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'}
            </Text>
            <Text style={s.emptySub}>
              {tab === 'upcoming'
                ? 'Add a ticket using the + button above'
                : 'Attended events will appear here'}
            </Text>
            {tab === 'upcoming' && (
              <TouchableOpacity style={s.emptyAddBtn} onPress={() => setShowAdd(true)}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={s.emptyAddTxt}>Add Your First Ticket</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayed.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onDelete={removeTicket} />
          ))
        )}
      </ScrollView>

      <AddTicketModal
        visible={showAdd}
        holderName={user?.name || 'Ticket Holder'}
        onClose={() => setShowAdd(false)}
        onAdd={addTicket}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  addBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 20, padding: 8,
  },
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingHorizontal: 20,
  },
  tab: { paddingVertical: 12, marginRight: 24 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  tabTxt: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTxtActive: { color: '#3b82f6' },
  tipBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, padding: 12,
    backgroundColor: '#eff6ff', borderRadius: 10,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  tipText: { flex: 1, fontSize: 13, color: '#1d4ed8', lineHeight: 18 },
  scroll: { paddingVertical: 20, paddingHorizontal: 24, gap: 28 },
  empty: { alignItems: 'center', paddingTop: 50, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, backgroundColor: '#3b82f6',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  emptyAddTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const card = StyleSheet.create({
  wrapper: {
    width: TICKET_WIDTH, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14, shadowRadius: 14, elevation: 8,
  },
  top: { padding: 22, paddingBottom: 18 },
  catBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10,
  },
  catText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 21, fontWeight: '800', lineHeight: 26, marginBottom: 8 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  venueText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateBlock: { alignItems: 'center', gap: 2 },
  dateDay: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '600' },
  dateNum: { color: '#fff', fontSize: 17, fontWeight: '800' },
  dateMon: { color: 'rgba(255,255,255,0.65)', fontSize: 10 },
  sep: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.25)' },
  perf: {
    flexDirection: 'row', alignItems: 'center', height: 20, overflow: 'visible',
  },
  circleL: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#f1f5f9', marginLeft: -11, zIndex: 1,
  },
  circleR: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#f1f5f9', marginRight: -11, zIndex: 1,
  },
  dashes: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dash: { width: 6, height: 2, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 1 },
  bottom: {
    backgroundColor: '#fff', padding: 18,
    borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 2,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  stubRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  stubField: { flex: 1 },
  stubLabel: { fontSize: 9, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 3 },
  stubValue: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  qrBox: {
    width: 84, height: 84, borderRadius: 8,
    backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  confirmCode: { fontSize: 17, fontWeight: '800', color: '#1f2937', letterSpacing: 2 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, marginTop: 14, paddingVertical: 8,
    borderRadius: 8, backgroundColor: '#fef2f2',
  },
  deleteTxt: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 16 },
  methodList: { padding: 24, gap: 14 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#f9fafb', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: '#e5e7eb',
  },
  methodIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  methodText: { flex: 1 },
  methodTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  methodSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  comingSoon: {
    backgroundColor: '#fef9c3', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  comingSoonText: { fontSize: 11, color: '#ca8a04', fontWeight: '700' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { color: '#3b82f6', fontSize: 15, fontWeight: '600' },
  form: { padding: 24, gap: 4, paddingBottom: 48 },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: '#1f2937', backgroundColor: '#f9fafb',
  },
  catRow: { gap: 8, paddingBottom: 4 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, backgroundColor: '#3b82f6',
    paddingVertical: 14, borderRadius: 14,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
