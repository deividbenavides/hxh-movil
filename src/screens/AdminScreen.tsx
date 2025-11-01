import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { getAllPgCharacters } from "../services/hxhPg";
import { getAllMongoCharacters } from "../services/hxhMongo";

export default function AdminScreen() {
  const [pgList, setPgList] = useState<any[]>([]);
  const [mongoList, setMongoList] = useState<any[]>([]);

  async function load() {
    try {
      const pg = await getAllPgCharacters();
      const mg = await getAllMongoCharacters();
      setPgList(pg);
      setMongoList(mg);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>PostgreSQL (6 personajes)</Text>
      {pgList.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text>Edad: {item.age}</Text>
        </View>
      ))}

      <Text style={[styles.title, { marginTop: 24 }]}>MongoDB (6 personajes)</Text>
      {mongoList.map((item) => (
        <View key={item.name} style={styles.card}>
          <Text style={styles.cardTitle}>{item.displayName || item.name}</Text>
          <Text>Nen: {item.nen_type}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.btn} onPress={load}>
        <Text style={styles.btnText}>Refrescar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  card: {
    backgroundColor: "#e2e8f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  cardTitle: { fontWeight: "bold" },
  btn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});
