// src/screens/CreateMongoCharacterScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { createMongoCharacter } from "../services/hxh";

export default function CreateMongoCharacterScreen() {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function handleSave() {
    if (!name || !displayName) {
      Alert.alert("Faltan datos", "name y displayName son obligatorios");
      return;
    }

    try {
      await createMongoCharacter({
        name,
        displayName,
        imageUrl,
      });
      Alert.alert("Listo ✅", "Personaje creado en Mongo");
      setName("");
      setDisplayName("");
      setImageUrl("");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "No se pudo crear el personaje");
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
        Crear personaje (Mongo)
      </Text>

      <Text>name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />

      <Text>displayName</Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />

      <Text>imageUrl (opcional)</Text>
      <TextInput
        value={imageUrl}
        onChangeText={setImageUrl}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />

      <Button title="Guardar" onPress={handleSave} />
    </View>
  );
}
