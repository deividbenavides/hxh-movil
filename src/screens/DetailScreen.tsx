import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from "react-native";
import { useRoute } from "@react-navigation/native";

export default function DetailScreen() {
  const route = useRoute<any>();
  const { source, data } = route.params || {};
  const [open, setOpen] = useState(false);

  // normalizamos campos
  const nombre = data?.displayName || data?.name || "Sin nombre";
  const imageUrl =
    data?.image_url || // PG
    data?.imageUrl || // Mongo
    "https://via.placeholder.com/300x300?text=HxH";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle ({source})</Text>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <Text style={styles.name}>{nombre}</Text>

      <Text style={styles.sub}>
        Edad: {data?.age ?? "?"} | Altura: {data?.height_cm ?? "?"} cm
      </Text>

      <TouchableOpacity style={styles.btn} onPress={() => setOpen(true)}>
        <Text style={styles.btnText}>Ver información adicional</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{nombre}</Text>
            <Text>DB: {source === "pg" ? "PostgreSQL" : "MongoDB"}</Text>
            <Text>Descripción: {data?.description || data?.role || "Sin descripción"}</Text>
            <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={() => setOpen(false)}>
              <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16, alignItems: "center" },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  image: { width: 240, height: 240, borderRadius: 12, backgroundColor: "#e2e8f0" },
  name: { color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 12 },
  sub: { color: "#cbd5f5", marginTop: 4 },
  btn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
});
