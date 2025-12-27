# Project: Sidequest (React Native Edition)

## 1. Core Concept
An iOS-first roommate grocery app.
- **Goal:** Gamify grocery shopping.
- **Key Features:** Geofencing (Notifies users near stores), Receipt OCR (Splits costs), Bounties (Rewards for shopping).

## 2. Tech Stack & Rules
- **Framework:** React Native (Expo SDK 50+).
- **Language:** TypeScript (Strict mode).
- **Backend:** Supabase (Auth, Database, Realtime).
- **Navigation:** Expo Router (File-based routing).
- **Maps:** `react-native-maps` (Using Apple Maps provider on iOS).
- **Styling:** `StyleSheet` (Standard React Native styling).
- **Icons:** `@expo/vector-icons` (Do not use external icon libraries).

## 3. Critical Libraries
- **Geofencing:** `expo-location` (Use `startGeofencingAsync`).
- **Auth:** `expo-apple-authentication` (Native Sign in with Apple).
- **OCR:** `react-native-text-recognition` (Wraps Apple Vision Framework).
- **Database:** `@supabase/supabase-js`.

## 4. Architecture: The "Thick Client"
We perform logic on the device to save server costs.
- **OCR:** App parses text -> App identifies items -> App sends JSON to Supabase.
- **Split Logic:** App calculates tax/tip ratios locally before saving.
- **Search:** We use a custom Expo Module to bridge Apple's `MKLocalSearch` (free) instead of Google Places API.

## 5. Database Schema (Supabase)
*Copilot: Use these types for generating TypeScript interfaces.*

```sql
-- USERS (Linked to Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  venmo_handle TEXT
);

-- SHOPPING_ITEMS
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY,
  household_id UUID,
  name TEXT,
  bounty_amount DECIMAL, -- Extra credit for the shopper
  status TEXT -- 'pending' or 'purchased'
);

-- TRANSACTIONS
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  payer_id UUID,
  total_amount DECIMAL,
  receipt_url TEXT
);

-- DEBT_LEDGER (Who owes whom)
CREATE TABLE debt_ledger (
  id UUID PRIMARY KEY,
  borrower_id UUID,
  lender_id UUID,
  amount DECIMAL,
  is_settled BOOLEAN
);
```

## 6. Coding Guidelines for Copilot
- No "any" types. Always define interfaces based on the DB schema.
- Supabase Singleton: Use a single lib/supabase.ts file for the client.
- Expo Router: Use app/index.tsx, app/(tabs)/_layout.tsx for structure.
- Permissions: Always check Location.requestForegroundPermissionsAsync() before geofencing.

## 7. Libraries:
Styling: NativeWind (Tailwind CSS).
Icons: Lucide React Native.
State: Zustand.
UI Components: @gorhom/bottom-sheet for the map drawer.