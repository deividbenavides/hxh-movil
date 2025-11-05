// src/services/resilient.ts
import {
  createPgCharacter, updatePgCharacter, deletePgCharacter,
  createMongoCharacter, updateMongoCharacter, deleteMongoCharacter
} from "./hxh";

/** Crea: intenta PG -> fallback Mongo */
export async function createCharacterResilient(payload: any) {
  try { return await createPgCharacter(payload); }
  catch { return await createMongoCharacter(payload); }
}

/** Actualiza: si trae id numérico usa PG; si trae _id string usa Mongo; sino intenta PG y cae a Mongo */
export async function updateCharacterResilient(item: any, payload: any) {
  if (item?.id != null) {
    try { return await updatePgCharacter(Number(item.id), payload); }
    catch { /* fallback */ }
  }
  if (item?._id) {
    try { return await updateMongoCharacter(String(item._id), payload); }
    catch { /* fallback */ }
  }
  // intento genérico
  try { return await updatePgCharacter(Number(payload.id), payload); }
  catch { return await updateMongoCharacter(String(payload._id), payload); }
}

/** Elimina: igual lógica que update */
export async function deleteCharacterResilient(item: any) {
  if (item?.id != null) {
    try { await deletePgCharacter(Number(item.id)); return true; }
    catch { /* fallback */ }
  }
  if (item?._id) {
    try { await deleteMongoCharacter(String(item._id)); return true; }
    catch { /* fallback */ }
  }
  // sin IDs claros: no hace nada
  throw new Error("No hay id/_id para eliminar");
}
