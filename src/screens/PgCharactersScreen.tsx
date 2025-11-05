// src/screens/PgCharactersScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { getPgCharacters } from "../services/hxh";

export default function PgCharactersScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPgCharacters()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.log(err);
        setError("No se pudo cargar desde PostgreSQL");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Text style={{ padding: 16 }}>Cargando PG…</Text>;
  if (error) return <Text style={{ padding: 16, color: "red" }}>{error}</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
        Personajes (PostgreSQL)
      </Text>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => item.id?.toString() ?? String(idx)}
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
              {item.displayname || item.displayName || item.name}
            </Text>
            {item.clan ? <Text>Clan: {item.clan}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}
