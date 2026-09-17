import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useUserStore } from "../store/userStore";
import { navigationRef } from "./navigationRef";

// Import screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import InterestsScreen from "../screens/InterestsScreen";
import MainTabNavigator from "./MainTabNavigator";
import LoadingScreen from "../screens/LoadingScreen";

const AppStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

// MainStack simply wraps the Tab navigator.
// Wallet and Interests live inside each tab's own stack — no duplicates here.
function MainStackNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={MainTabNavigator} />
    </MainStack.Navigator>
  );
}

const AppNavigator = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const { user, firstLogin, loadUserFromStorage, isLoading } = useUserStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadUserFromStorage();
      } catch (error) {
        console.error("Failed to load user from storage:", error);
      } finally {
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while initializing
  if (!isAppReady || isLoading) {
    return <LoadingScreen message="Preparing Migo..." />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Not logged in
          <>
            <AppStack.Screen name="Login" component={LoginScreen} />
            <AppStack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : firstLogin ? (
          // First login - show interests screen
          <AppStack.Screen name="Interests" component={InterestsScreen} />
        ) : (
          // Logged in - show main app with global screens (Wallet, etc.)
          <AppStack.Screen name="Main" component={MainStackNavigator} />
        )}
      </AppStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
