// src/config/api.ts

// Cambia esto a false cuando quieras usar tus APIs locales
const IS_PROD = true;

const LOCAL = {
  PG: "http://192.168.0.10:5001",      // ⬅️ tu IP local + puerto PG
  MONGO: "http://192.168.0.10:5002",   // ⬅️ tu IP local + puerto Mongo
};

const PROD = {
  PG: "https://hxh-movil.onrender.com",   // ⬅️ Render PG
  MONGO: "https://hxh-mongo.onrender.com" // ⬅️ Render Mongo
};

export const API = IS_PROD ? PROD : LOCAL;
