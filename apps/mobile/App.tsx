import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Image, StyleSheet, View } from "react-native"; // Changed: Added Image
import { useUserStore } from "./src/store/userStore";
import { authService } from "./src/services/auth.service";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Screens
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import InterestsScreen from "./src/screens/InterestsScreen";
import HomeScreen from "./src/screens/HomeScreen";
import EventsScreen from "./src/screens/EventsScreen";
import EventDetailScreen from "./src/screens/EventsDetailScreen";
import ChatScreen from "./src/screens/ChatScreen";
import AIEventsScreen from "./src/screens/AIEventsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import ConnectionTestScreen from "./src/screens/ConnectionTestScreen";
import LoadingScreen from "./src/screens/LoadingScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Icon Component
const CustomTabIcon = ({ routeName, focused }: { routeName: string, focused: boolean }) => {
  let iconSource;
  
  switch (routeName) {
    case "HomeTab":
      iconSource = require('./assets/icons/home.png');
      break;
    case "EventsTab":
      iconSource = require('./assets/icons/events.png');
      break;
    case "ChatTab":
      iconSource = require('./assets/icons/AIchat.png');
      break;
    case "ProfileTab":
      iconSource = require('./assets/icons/profile.png');
      break;
    default:
      iconSource = require('./assets/icons/home.png');
  }
  
  return (
    <View style={styles.iconContainer}>
      <Image 
        source={iconSource} 
        style={[
          styles.tabIcon,
          { tintColor: focused ? "#3b82f6" : "#9ca3af" }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

// Updated MainTabs with custom icons
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <CustomTabIcon routeName={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsScreen}
        options={{ title: "Events" }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{ title: "AI Chat" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

// Profile Stack Navigator for nested navigation
export function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Interests"
        component={InterestsScreen}
        options={{ title: "Update Interests" }}
      />
      <Stack.Screen
        name="ConnectionTest"
        component={ConnectionTestScreen}
        options={{ title: "Connection Test" }}
      />
    </Stack.Navigator>
  );
}

// Updated MainTabsWithProfileStack with custom icons
function MainTabsWithProfileStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <CustomTabIcon routeName={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsScreen}
        options={{ title: "Events" }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{ title: "AI Chat" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, firstLogin, loadUserFromStorage, setUser, setFirstLogin } = useUserStore();
  const [appLoading, setAppLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🔍 Starting app initialization...');
      
      // Load stored data first
      await loadUserFromStorage();
      
      // Check if we have a stored token and validate it
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      console.log('📦 Stored data:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasStoredUser: !!storedUser,
        userFromStore: user,
        firstLoginFromStore: firstLogin,
      });
      
      if (accessToken && refreshToken && storedUser) {
        try {
          // Initialize API with stored token
          await authService.initializeApiToken();
          
          // Try to get current user to validate token
          const currentUser = await authService.getCurrentUser();
          console.log('✅ Valid token, user:', currentUser.email);
          
          // Check if user has interests for first login logic
          const parsedUser = JSON.parse(storedUser);
          const hasInterests = parsedUser.interests && parsedUser.interests.length > 0;
          
          setUser(parsedUser);
          setFirstLogin(!hasInterests);
          
        } catch (error) {
          console.log(
            '❌ Token validation failed:',
            error instanceof Error ? error.message : String(error)
          );
          // Clear invalid tokens
          await authService.logout();
          setUser(null);
          setFirstLogin(false);
        }
      } else {
        console.log('📭 No stored tokens found, showing login screen');
        setUser(null);
        setFirstLogin(false);
      }
      
    } catch (error) {
      console.error('🚨 Failed to initialize app:', error);
      // Clear everything on error
      await authService.logout();
      setUser(null);
      setFirstLogin(false);
    } finally {
      setAppLoading(false);
      setAuthChecked(true);
    }
  };

  if (appLoading) {
    return <LoadingScreen message="Initializing app..." />;
  }

  console.log('📍 Navigation state:', {
    user: user ? user.email : 'No user',
    firstLogin,
    showingAuth: !user,
    showingInterests: user && firstLogin,
    showingMain: user && !firstLogin,
  });

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={!user ? "Register" : undefined}>
          {!user ? (
            // Auth Screens
            <>
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />

            </>
          ) : firstLogin ? (
            // First Login - Interests Selection
            <Stack.Screen
              name="Interests"
              component={InterestsScreen}
              options={{ headerShown: false }}
            />
          ) : (
            // Main App
            <>
              <Stack.Screen
                name="Main"
                component={MainTabsWithProfileStack}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="EventDetail"
                component={EventDetailScreen}
                options={{
                  title: "Event Details",
                  headerBackTitle: "Back",
                }}
              />
              <Stack.Screen
                name="AIEvents"
                component={AIEventsScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
});