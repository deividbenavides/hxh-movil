// src/services/hxhPg.ts
import { pgApi } from "./api";

export async function getAllPgCharacters() {
  const res = await pgApi.get("/characters");
  return res.data;
}

export async function getPgCharacterById(id: number) {
  const res = await pgApi.get(`/characters/${id}`);
  return res.data;
}

// CRUD
export async function createPgCharacter(data: any) {
  const res = await pgApi.post("/characters", data);
  return res.data;
}

export async function updatePgCharacter(id: number, data: any) {
  const res = await pgApi.put(`/characters/${id}`, data);
  return res.data;
}

export async function deletePgCharacter(id: number) {
  const res = await pgApi.delete(`/characters/${id}`);
  return res.data;
}
