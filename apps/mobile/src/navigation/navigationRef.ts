/**
 * navigationRef.ts
 *
 * Stores the ACTUAL navigation objects from the navigators that own each screen,
 * so any screen can navigate across navigator boundaries without relying on
 * React Navigation v7's unreliable action propagation.
 *
 * These refs are set by the navigator components themselves (MainTabNavigator
 * and CustomTabBar) which receive the correct navigation prop from React Navigation.
 *
 * Usage from any screen:
 *   import { navigateToTab, navigateToMainStack } from '../navigation/navigationRef';
 *   navigateToTab('Events', 'EventsMain', { venueFilter: 'Dubai' });
 *   navigateToMainStack('Wallet');
 */

// Root-level NavigationContainer ref — attach to <NavigationContainer ref={navigationRef}>.
// Navigate to Wallet (in MainStack) using:
//   navigationRef.current?.navigate('Main', { screen: 'Wallet' })
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

// MainStack's navigation (for the 'Tabs' screen in MainStack).
// Set by MainTabNavigator — calling navigate() on this navigates within MainStack.
let _mainStackNav: any = null;

// Tab navigator's navigation.
// Set by CustomTabBar — calling navigate() on this switches tabs.
let _tabNav: any = null;

// Direct callback to navigate to the Events tab.
// Registered synchronously in CustomTabBar on every render — same pattern as
// setTabNavigation — so it is always fresh when a button is pressed.
let _goToEventsTab: (() => void) | null = null;

export function setMainStackNavigation(nav: any) {
  _mainStackNav = nav;
}

export function setTabNavigation(nav: any) {
  _tabNav = nav;
}

/** Called by CustomTabBar on every render to keep the callback fresh. */
export function registerEventsTabCallback(fn: () => void) {
  _goToEventsTab = fn;
}

/** Navigate to the Events tab from anywhere in the app. */
export function navigateToEventsTab() {
  if (_goToEventsTab) {
    _goToEventsTab();
  } else {
    console.warn('[navigationRef] Events tab callback not ready');
  }
}

/**
 * Navigate to a screen that lives directly in MainStack: 'Wallet' or 'Interests'.
 */
export function navigateToMainStack(screenName: string, params?: Record<string, any>) {
  if (_mainStackNav) {
    _mainStackNav.navigate(screenName, params);
  } else {
    console.warn('[navigationRef] MainStack navigation not ready');
  }
}

/**
 * Navigate to a tab, optionally to a nested screen inside that tab's stack.
 * e.g. navigateToTab('Events', 'EventsMain', { venueFilter: 'Dubai Expo' })
 */
export function navigateToTab(
  tabName: string,
  nestedScreen?: string,
  nestedParams?: Record<string, any>,
) {
  if (_tabNav) {
    if (nestedScreen) {
      _tabNav.navigate(tabName, { screen: nestedScreen, params: nestedParams });
    } else {
      _tabNav.navigate(tabName);
    }
  } else {
    console.warn('[navigationRef] Tab navigation not ready');
  }
}
