import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../store/userStore';
import { EVENT_CATEGORY_LABELS } from '@migo/shared';

// Convert category labels to array for selection
const eventCategories = Object.values(EVENT_CATEGORY_LABELS);

interface Props {
  navigation: any;
}

const InterestsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateInterests, isLoading, error, firstLogin } = useUserStore();

  // Pre-populate with user's already-chosen interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    user?.interests || []
  );

  // We're in "update" mode when the user is already logged in (firstLogin is false)
  const isUpdateMode = !firstLogin;

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };

  const handleSave = async () => {
    if (selectedInterests.length < 3) {
      Alert.alert('Select More Interests', 'Please select at least 3 interests to personalize your experience.');
      return;
    }

    try {
      await updateInterests(selectedInterests);

      if (isUpdateMode) {
        // In update mode: go back to wherever the user came from
        navigation.goBack();
      }
      // In first-login mode: AppNavigator's conditional rendering takes over
      // automatically when firstLogin becomes false — no manual navigate needed
    } catch (err) {
      Alert.alert('Error', 'Failed to save your interests. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isUpdateMode ? 'Update Your Interests' : 'Welcome to Migo Events! 🎉'}
          </Text>
          <Text style={styles.subtitle}>
            {isUpdateMode
              ? 'Tap to add or remove interests — your home feed updates automatically'
              : "Select your interests to discover events you'll love"}
          </Text>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {selectedInterests.length} of {eventCategories.length} selected
              {selectedInterests.length < 3 && ` (min. 3 required)`}
            </Text>
          </View>
        </View>

        <View style={styles.interestsGrid}>
          {eventCategories.map((interest) => {
            const isSelected = selectedInterests.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestButton,
                  isSelected && styles.interestButtonSelected,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.interestText,
                    isSelected && styles.interestTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.tip}>
            💡 Your home feed and event recommendations update based on your interests
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Saving your interests...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.continueButton,
                selectedInterests.length >= 3 && styles.continueButtonActive,
              ]}
              onPress={handleSave}
              disabled={selectedInterests.length < 3 || isLoading}
            >
              <Text style={styles.continueButtonText}>
                {selectedInterests.length >= 3
                  ? isUpdateMode
                    ? `Save ${selectedInterests.length} Interests`
                    : `Continue with ${selectedInterests.length} interests`
                  : `Select ${3 - selectedInterests.length} more to continue`}
              </Text>
            </TouchableOpacity>
          )}

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  counter: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  interestButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  interestButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  interestTextSelected: {
    color: '#fff',
  },
  bottomSection: {
    marginTop: 'auto',
  },
  tip: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#d1d5db',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonActive: {
    backgroundColor: '#3b82f6',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
});

export default InterestsScreen;
