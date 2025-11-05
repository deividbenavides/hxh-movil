import React from "react";
import { View, Text, Button, FlatList, TouchableOpacity } from "react-native";
import { useCharactersResilient } from "../services/useCharacters";
import { createCharacterResilient, updateCharacterResilient, deleteCharacterResilient } from "../services/resilient";

export default function ResilientCharactersScreen() {
  const { data, source, loading, error, reload } = useCharactersResilient();

  const onCreate = async () => {
    await createCharacterResilient({
      name: "gon",
      displayName: "Gon Freecss",
      age: 12,
      height_cm: 154,
      weight_kg: 49,
      nen_type: "Refuerzo",
      role: "Hunter",
      imageUrl: "https://mi-img.com/gon.png",
    });
    await reload();
  };

  const onUpdateFirst = async () => {
    if (!data.length) return;
    const first = data[0];
    await updateCharacterResilient(first, { displayName: "UPDATED " + (first.displayname || first.displayName || first.name) });
    await reload();
  };

  const onDeleteFirst = async () => {
    if (!data.length) return;
    const first = data[0];
    await deleteCharacterResilient(first);
    await reload();
  };

  if (loading) return <Text style={{ padding: 16 }}>Cargando…</Text>;
  if (error)   return <Text style={{ padding: 16, color: "red" }}>{error}</Text>;

  return (
    <View style={{ flex: 1, padding: 16, gap: 8 }}>
      <Text>Fuente: <Text style={{ fontWeight: "bold" }}>{(source || "").toUpperCase()}</Text></Text>

      <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
        <Button title="Recargar" onPress={reload} />
        <Button title="Crear (resiliente)" onPress={onCreate} />
        <Button title="Editar 1ro" onPress={onUpdateFirst} />
        <Button title="Eliminar 1ro" onPress={onDeleteFirst} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => String(item._id ?? item.id ?? idx)}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ padding: 12, marginBottom: 8, backgroundColor: "#eee", borderRadius: 8 }}>
            <Text style={{ fontWeight: "bold" }}>
              {item.displayname || item.displayName || item.name}
            </Text>
            {item.id != null && <Text>ID PG: {item.id}</Text>}
            {item._id && <Text>ID Mongo: {String(item._id)}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
