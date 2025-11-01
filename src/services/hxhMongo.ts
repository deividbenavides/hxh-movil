// src/services/hxhMongo.ts
import { mongoApi } from "./api";

export async function getAllMongoCharacters() {
  const res = await mongoApi.get("/characters");
  return res.data;
}

export async function getMongoCharacterByName(name: string) {
  const res = await mongoApi.get(`/characters/${name.toLowerCase()}`);
  return res.data;
}

// CRUD
export async function createMongoCharacter(data: any) {
  const res = await mongoApi.post("/characters", data);
  return res.data;
}

export async function updateMongoCharacter(name: string, data: any) {
  const res = await mongoApi.put(`/characters/${name.toLowerCase()}`, data);
  return res.data;
}

export async function deleteMongoCharacter(name: string) {
  const res = await mongoApi.delete(`/characters/${name.toLowerCase()}`);
  return res.data;
}
