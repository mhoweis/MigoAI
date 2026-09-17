/**
 * pendingEventsFilter.ts
 *
 * Simple singleton to pass a date filter from ChatScreen to EventsScreen
 * without relying on React Navigation's nested-param dispatch (which is
 * unreliable across tab boundaries in React Navigation v7).
 *
 * Usage:
 *   // Sender (ChatScreen):
 *   setPendingEventsFilter({ dateFrom: '...', dateTo: '...' });
 *   navigation.dispatch(TabActions.jumpTo('Events'));
 *
 *   // Receiver (EventsScreen — inside useFocusEffect):
 *   const pending = consumePendingEventsFilter();
 *   if (pending) { setDateFrom(pending.dateFrom); setDateTo(pending.dateTo); }
 */

let _pending: { dateFrom: string; dateTo: string } | null = null;

export function setPendingEventsFilter(filter: { dateFrom: string; dateTo: string } | null) {
  _pending = filter;
}

export function consumePendingEventsFilter(): { dateFrom: string; dateTo: string } | null {
  const f = _pending;
  _pending = null;
  return f;
}
