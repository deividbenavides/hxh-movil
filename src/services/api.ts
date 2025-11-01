// src/services/api.ts
import axios from "axios";

// cuando estés en la nube, cambias estos dos:
const PG_BASE_URL = "http://localhost:5001";
const MONGO_BASE_URL = "http://localhost:5002";

export const pgApi = axios.create({
  baseURL: PG_BASE_URL,
  timeout: 5000,
});

export const mongoApi = axios.create({
  baseURL: MONGO_BASE_URL,
  timeout: 5000,
});
