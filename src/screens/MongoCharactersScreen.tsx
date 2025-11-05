// src/screens/MongoCharactersScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { getMongoCharacters } from "../services/hxh";

export default function MongoCharactersScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMongoCharacters()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.log(err);
        setError("No se pudo cargar desde Mongo");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Text style={{ padding: 16 }}>Cargando Mongo…</Text>;
  if (error) return <Text style={{ padding: 16, color: "red" }}>{error}</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
        Personajes (MongoDB)
      </Text>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => item._id ?? String(idx)}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              marginBottom: 8,
              backgroundColor: "#eee",
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {item.displayName || item.name}
            </Text>
            {item.nen_type ? <Text>Nen: {item.nen_type}</Text> : null}
            {item.role ? <Text>Rol: {item.role}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}
