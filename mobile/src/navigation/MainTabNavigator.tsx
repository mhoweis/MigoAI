// src/navigation/MainTabNavigator.tsx - CUSTOM TAB BAR SOLUTION
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setMainStackNavigation, setTabNavigation } from './navigationRef';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventsDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import AIEventsScreen, { AIEventsParams } from '../screens/AIEventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import InterestsScreen from '../screens/InterestsScreen';
import ConnectionTestScreen from '../screens/ConnectionTestScreen';
import WalletScreen from '../screens/WalletScreen';

// Param list types — exported so screens can type their navigation props
export type HomeStackParamList = {
  HomeMain: undefined;
  EventDetail: { eventId: string };
  ConnectionTest: undefined;
  Interests: undefined;
};

export type EventsStackParamList = {
  EventsMain: { venueFilter?: string; dateFrom?: string; dateTo?: string } | undefined;
  EventDetail: { eventId: string };
};

export type ChatStackParamList = {
  ChatMain: undefined;
  AIEvents: AIEventsParams;
  EventDetail: { eventId: string };
  Interests: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Interests: undefined;
  ConnectionTest: undefined;
};

export type WalletStackParamList = {
  WalletMain: undefined;
};

const Tab = createBottomTabNavigator();
const HomeStack    = createNativeStackNavigator<HomeStackParamList>();
const EventsStack  = createNativeStackNavigator<EventsStackParamList>();
const ChatStack    = createNativeStackNavigator<ChatStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const WalletStack  = createNativeStackNavigator<WalletStackParamList>();

// Home Stack Navigator
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          title: 'Event Details',
          headerBackTitle: 'Back',
        }}
      />
      <HomeStack.Screen
        name="ConnectionTest"
        component={ConnectionTestScreen}
        options={{ title: 'Connection Test', headerBackTitle: 'Back' }}
      />
      <HomeStack.Screen
        name="Interests"
        component={InterestsScreen}
        options={{ title: 'Update Interests', headerBackTitle: 'Back' }}
      />
    </HomeStack.Navigator>
  );
}

// Events Stack Navigator
function EventsStackNavigator() {
  return (
    <EventsStack.Navigator>
      <EventsStack.Screen
        name="EventsMain"
        component={EventsScreen}
        options={{ headerShown: false }}
      />
      <EventsStack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          title: 'Event Details',
          headerBackTitle: 'Back',
        }}
      />
    </EventsStack.Navigator>
  );
}

// Chat Stack Navigator — gives ChatScreen a proper stack so it can navigate
// to AIEventsScreen (and EventDetail) without any cross-tab hacks.
function ChatStackNavigator() {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen
        name="ChatMain"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <ChatStack.Screen
        name="AIEvents"
        component={AIEventsScreen}
        options={{ headerShown: false }}
      />
      <ChatStack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: 'Event Details', headerBackTitle: 'Back' }}
      />
      <ChatStack.Screen
        name="Interests"
        component={InterestsScreen}
        options={{ title: 'Update Interests', headerBackTitle: 'Back' }}
      />
    </ChatStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Interests"
        component={InterestsScreen}
        options={{
          title: 'Select Interests',
          headerBackTitle: 'Back',
        }}
      />
      <ProfileStack.Screen
        name="ConnectionTest"
        component={ConnectionTestScreen}
        options={{ title: 'Connection Test', headerBackTitle: 'Back' }}
      />
    </ProfileStack.Navigator>
  );
}

// Wallet Stack Navigator
function WalletStackNavigator() {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false }}>
      <WalletStack.Screen name="WalletMain" component={WalletScreen} />
    </WalletStack.Navigator>
  );
}

// CUSTOM TAB BAR COMPONENT
function CustomTabBar({ state, descriptors, navigation }: any) {
  // Keep the legacy ref in sync (used by navigateToMainStack elsewhere).
  setTabNavigation(navigation);

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Get icon based on route name
        const iconColor = isFocused ? '#3b82f6' : '#6b7280';
        let iconSource: any = null;
        let walletIcon = false;
        switch (route.name) {
          case 'Home':
            iconSource = require('../../assets/icons/home.png');
            break;
          case 'Events':
            iconSource = require('../../assets/icons/events.png');
            break;
          case 'Chat':
            iconSource = require('../../assets/icons/AIchat.png');
            break;
          case 'Wallet':
            walletIcon = true;
            break;
          case 'Profile':
            iconSource = require('../../assets/icons/profile.png');
            break;
          default:
            iconSource = require('../../assets/icons/home.png');
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            {walletIcon ? (
              <Ionicons
                name={isFocused ? 'wallet' : 'wallet-outline'}
                size={28}
                color={iconColor}
                style={{ marginBottom: 4 }}
              />
            ) : (
              <Image
                source={iconSource}
                style={[styles.tabIcon, { tintColor: iconColor }]}
                resizeMode="contain"
              />
            )}
            <Text style={[styles.tabLabel, { color: iconColor }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Main Tab Navigator with Custom Tab Bar
// Receives the MainStack navigation as a prop (rendered as MainStack.Screen "Tabs")
function MainTabNavigator({ navigation }: { navigation: any }) {
  setMainStackNavigation(navigation);

  return (
    <Tab.Navigator
      id="MainTab"
      tabBar={(props) => {
        setTabNavigation(props.navigation);
        return <CustomTabBar {...props} />;
      }}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeStackNavigator}    options={{ title: 'Home' }} />
      <Tab.Screen name="Events"  component={EventsStackNavigator}  options={{ title: 'Events' }} />
      <Tab.Screen name="Chat"    component={ChatStackNavigator}    options={{ title: 'AI Chat' }} />
      <Tab.Screen name="Wallet"  component={WalletStackNavigator}  options={{ title: 'Wallet' }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MainTabNavigator;
