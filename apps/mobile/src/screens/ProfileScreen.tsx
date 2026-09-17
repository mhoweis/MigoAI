// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../store/userStore';
import { ProfileStackParamList } from '../navigation/MainTabNavigator';
import { navigationRef } from '../navigation/navigationRef';

type ProfileScreenNavigationProp = NavigationProp<ProfileStackParamList, 'ProfileMain'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout, updateProfile, setUser } = useUserStore();

  const [showNameModal, setShowNameModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      // 'localProfileAvatar' key is NOT removed on logout, so it survives re-login
      await AsyncStorage.setItem('localProfileAvatar', uri);
      if (user) await setUser({ ...user, avatar: uri });
    }
  };

  // ── Name edit ─────────────────────────────────────────────────────────────
  const openNameModal = () => {
    setEditName(user?.name || '');
    setShowNameModal(true);
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (trimmed === user?.name) {
      setShowNameModal(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ name: trimmed });
      // Always persist locally so the name survives logout/re-login
      // (updateProfile handles API fallback internally and never throws)
      await AsyncStorage.setItem('localProfileName', trimmed);
    } finally {
      setIsSaving(false);
      setShowNameModal(false);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNavigateToWallet = () => {
    // Use the root navigationRef with the full nested path — bypasses all
    // routing ambiguity and works reliably across Fast Refresh.
    (navigationRef.current as any)?.navigate('Main', {
      screen: 'Tabs',
      params: { screen: 'Wallet' },
    });
  };

  const handleNavigateToInterests = () => {
    navigation.navigate('Interests');
  };

  const handleNavigateToConnectionTest = () => {
    navigation.navigate('ConnectionTest');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* ── User Info ── */}
        <View style={styles.section}>
          <View style={styles.userInfo}>

            {/* Tappable avatar */}
            <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={44} color="#9ca3af" />
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.userDetails}>
              {/* Tappable name */}
              <TouchableOpacity onPress={openNameModal} style={styles.nameRow}>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Ionicons name="pencil" size={14} color="#9ca3af" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={handleNavigateToWallet}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="wallet-outline" size={24} color="#3b82f6" />
              <Text style={styles.menuItemText}>My Wallet</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNavigateToInterests}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="heart-outline" size={24} color="#4b5563" />
              <Text style={styles.menuItemText}>Update Interests</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNavigateToConnectionTest}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="wifi-outline" size={24} color="#4b5563" />
              <Text style={styles.menuItemText}>Connection Test</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={logout}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Edit Name Modal ── */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.nameInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor="#9ca3af"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveName}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileScreen;
