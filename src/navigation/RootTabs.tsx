// src/navigation/RootTabs.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Pantallas
import HomeScreen from "../screens/HomeScreen";
import MongoCharactersScreen from "../screens/MongoCharactersScreen";
import PgCharactersScreen from "../screens/PgCharactersScreen";
import CreateMongoCharacterScreen from "../screens/CreateMongoCharacterScreen";
import ResilientCharactersScreen from "../screens/ResilientCharactersScreen";

// (Opcional) Si tienes @expo/vector-icons, descomenta esto para íconos bonitos
// import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

export default function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        // (Opcional) ejemplo de íconos:
        // tabBarIcon: ({ color, size, focused }) => (
        //   <Ionicons name={focused ? "planet" : "planet-outline"} size={size} color={color} />
        // ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Inicio" }}
      />

      <Tab.Screen
        name="Mongo"
        component={MongoCharactersScreen}
        options={{ title: "MongoDB" }}
      />

      <Tab.Screen
        name="PostgreSQL"
        component={PgCharactersScreen}
        options={{ title: "PostgreSQL" }}
      />

      <Tab.Screen
        name="CrearMongo"
        component={CreateMongoCharacterScreen}
        options={{ title: "Crear (Mongo)" }}
      />

      <Tab.Screen
        name="Resilient"
        component={ResilientCharactersScreen}
        options={{ title: "Resilient" }}
      />
    </Tab.Navigator>
  );
}
