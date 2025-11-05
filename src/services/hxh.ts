// src/services/hxh.ts
import axios from "axios";
import { API } from "../config/api";

// ========== MONGO ==========
export async function getMongoCharacters() {
  const { data } = await axios.get(`${API.MONGO}/characters`);
  return data;
}

export async function createMongoCharacter(payload: any) {
  const { data } = await axios.post(`${API.MONGO}/characters`, payload);
  return data;
}

export async function updateMongoCharacter(id: string, payload: any) {
  const { data } = await axios.put(`${API.MONGO}/characters/${id}`, payload);
  return data;
}

export async function deleteMongoCharacter(id: string) {
  await axios.delete(`${API.MONGO}/characters/${id}`);
  return true;
}

// ========== PG ==========
export async function getPgCharacters() {
  const { data } = await axios.get(`${API.PG}/characters`);
  return data;
}

export async function createPgCharacter(payload: any) {
  const { data } = await axios.post(`${API.PG}/characters`, payload);
  return data;
}

export async function updatePgCharacter(id: number, payload: any) {
  const { data } = await axios.put(`${API.PG}/characters/${id}`, payload);
  return data;
}

export async function deletePgCharacter(id: number) {
  await axios.delete(`${API.PG}/characters/${id}`);
  return true;
}
