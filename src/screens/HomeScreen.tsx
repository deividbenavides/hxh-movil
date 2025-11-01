import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { getPgCharacterById } from "../services/hxhPg";
import { getMongoCharacterByName } from "../services/hxhMongo";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const [pgId, setPgId] = useState("1"); // vamos a buscar por id (PG)
  const [pgResult, setPgResult] = useState<any>(null);

  const [mongoName, setMongoName] = useState("netero");
  const [mongoResult, setMongoResult] = useState<any>(null);

  const navigation = useNavigation<any>();

  async function handleSearchPg() {
    try {
      const data = await getPgCharacterById(Number(pgId));
      setPgResult(data);
      Alert.alert("PostgreSQL", "Personaje encontrado");
      // enviamos al detalle
      navigation.navigate("Detail", { source: "pg", data });
    } catch (err) {
      console.log(err);
      Alert.alert("PostgreSQL", "No se encontró ese ID");
    }
  }

  async function handleSearchMongo() {
    try {
      const data = await getMongoCharacterByName(mongoName);
      setMongoResult(data);
      Alert.alert("Mongo", "Personaje encontrado");
      navigation.navigate("Detail", { source: "mongo", data });
    } catch (err) {
      console.log(err);
      Alert.alert("Mongo", "No se encontró ese nombre");
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Hunter x Hunter (Relacional)</Text>
      <TextInput
        style={styles.input}
        placeholder="ID de personaje (1-6)"
        value={pgId}
        onChangeText={setPgId}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.btn} onPress={handleSearchPg}>
        <Text style={styles.btnText}>Buscar en PostgreSQL</Text>
      </TouchableOpacity>
      {pgResult && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resultado PG</Text>
          <Text>Nombre: {pgResult.name}</Text>
          <Text>Edad: {pgResult.age}</Text>
        </View>
      )}

      <Text style={[styles.title, { marginTop: 24 }]}>Hunter x Hunter (No relacional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre (netero, meruem, bisky...)"
        value={mongoName}
        onChangeText={setMongoName}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.btn} onPress={handleSearchMongo}>
        <Text style={styles.btnText}>Buscar en Mongo</Text>
      </TouchableOpacity>
      {mongoResult && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resultado Mongo</Text>
          <Text>Nombre: {mongoResult.displayName || mongoResult.name}</Text>
          <Text>Nen: {mongoResult.nen_type}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  card: {
    backgroundColor: "#e2e8f0",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  cardTitle: { fontWeight: "bold", marginBottom: 4 },
});
