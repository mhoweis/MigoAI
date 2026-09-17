// src/components/DateRangePickerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  visible: boolean;
  initialFrom?: string; // ISO string or empty
  initialTo?: string;   // ISO string or empty
  onApply: (from: string, to: string) => void;
  onClose: () => void;
}

const DateRangePickerModal: React.FC<Props> = ({
  visible, initialFrom, initialTo, onApply, onClose,
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [startDate, setStartDate] = useState<Date | null>(
    initialFrom ? new Date(initialFrom) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialTo ? new Date(initialTo) : null,
  );

  // Reset internal state whenever modal opens
  useEffect(() => {
    if (visible) {
      setStartDate(initialFrom ? new Date(initialFrom) : null);
      setEndDate(initialTo ? new Date(initialTo) : null);
      const ref = initialFrom ? new Date(initialFrom) : today;
      setViewYear(ref.getFullYear());
      setViewMonth(ref.getMonth());
    }
  }, [visible]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toMidnight = (d: Date) => {
    const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
  };

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handleDayPress = (day: number) => {
    const pressed = new Date(viewYear, viewMonth, day);
    if (!startDate || (startDate && endDate)) {
      // Begin a new selection
      setStartDate(pressed);
      setEndDate(null);
    } else {
      // Complete the range
      if (pressed < startDate) {
        setEndDate(toMidnight(startDate));
        setStartDate(toMidnight(pressed));
      } else if (sameDay(pressed, startDate)) {
        // Tapping same day = single-day selection
        setEndDate(pressed);
      } else {
        setEndDate(pressed);
      }
    }
  };

  const dayState = (day: number): 'start' | 'end' | 'inRange' | 'none' => {
    const d = new Date(viewYear, viewMonth, day);
    if (startDate && sameDay(d, startDate)) return 'start';
    if (endDate && sameDay(d, endDate)) return 'end';
    if (startDate && endDate && d > startDate && d < endDate) return 'inRange';
    return 'none';
  };

  const buildGrid = () => {
    const total = daysInMonth(viewYear, viewMonth);
    const offset = firstDayOfMonth(viewYear, viewMonth);
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  };

  const formatDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      : '—';

  const handleApply = () => {
    if (!startDate) return;
    const from = new Date(startDate); from.setHours(0, 0, 0, 0);
    const to = endDate ? new Date(endDate) : new Date(startDate);
    to.setHours(23, 59, 59, 999);
    onApply(from.toISOString(), to.toISOString());
  };

  const canApply = !!startDate;

  const hintText = !startDate
    ? 'Tap a day to set the start date'
    : !endDate
    ? 'Tap another day to set the end date'
    : 'Tap Apply or adjust the range';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Selected range display */}
          <View style={styles.rangeRow}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>FROM</Text>
              <Text style={[styles.rangeValue, !startDate && styles.rangeValueEmpty]}>
                {formatDate(startDate)}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#9ca3af" style={styles.rangeArrow} />
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>TO</Text>
              <Text style={[styles.rangeValue, !endDate && styles.rangeValueEmpty]}>
                {formatDate(endDate || startDate)}
              </Text>
            </View>
          </View>

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-back" size={22} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-forward" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.weekRow}>
            {DAY_HEADERS.map(d => (
              <Text key={d} style={styles.weekHeader}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          {buildGrid().map((row, ri) => (
            <View key={ri} style={styles.gridRow}>
              {row.map((day, ci) => {
                if (!day) return <View key={ci} style={styles.gridCell} />;
                const state = dayState(day);
                return (
                  <TouchableOpacity
                    key={ci}
                    style={[
                      styles.gridCell,
                      state === 'start' && styles.cellStart,
                      state === 'end' && styles.cellEnd,
                      state === 'inRange' && styles.cellInRange,
                    ]}
                    onPress={() => handleDayPress(day)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.dayText,
                      (state === 'start' || state === 'end') && styles.dayTextSelected,
                      state === 'inRange' && styles.dayTextInRange,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Hint text */}
          <Text style={styles.hint}>{hintText}</Text>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setStartDate(null); setEndDate(null); }}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, !canApply && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={!canApply}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  rangeItem: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7c3aed',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  rangeValueEmpty: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  rangeArrow: {
    marginHorizontal: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekHeader: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  gridCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: CELL_SIZE / 2,
  },
  cellStart: {
    backgroundColor: '#7c3aed',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  cellEnd: {
    backgroundColor: '#7c3aed',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  cellInRange: {
    backgroundColor: '#ede9fe',
    borderRadius: 0,
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  dayTextInRange: {
    color: '#7c3aed',
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#c4b5fd',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default DateRangePickerModal;
