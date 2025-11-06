// server-pg/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import pkg from "pg";
import swaggerUi from "swagger-ui-express";
const { Pool } = pkg;

/* ========== 1) ENV & POOL ========== */
const PORT = process.env.PORT || 5001;

// Si quieres, deja aquí “hardcoded” tu URL como ÚLTIMO fallback para pruebas
const HARDCODED = "postgresql://hxh_user:JcYkFbXd9szYc9iH8WmPh5P8VbmpSwla@dpg-d431pdm3jp1c73e44cng-a.oregon-postgres.render.com/hxh_db";

const DATABASE_URL =
  process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
    ? process.env.DATABASE_URL.trim()
    : HARDCODED; // ← mientras depuramos, usa la externa correcta

let parsedHost = "";
try {
  const u = new URL(DATABASE_URL);
  parsedHost = `${u.hostname}:${u.port || 5432}/${u.pathname.replace("/", "")}`;
} catch (e) {
  console.error("❌ DATABASE_URL inválida:", DATABASE_URL);
  process.exit(1);
}

console.log("🔧 DB target =>", parsedHost);

const pool = new Pool({
  connectionString: DATABASE_URL,
  // Render Postgres requiere SSL
  ssl: { rejectUnauthorized: false },
});

/* ========== 2) APP & SWAGGER ========== */
const app = express();
app.use(cors());
app.use(express.json());

const swaggerDoc = {
  openapi: "3.0.0",
  info: { title: "HXH API - PostgreSQL", version: "1.0.0" },
  servers: [{ url: "/" }],
  paths: {
    "/health": { get: { summary: "Health", responses: { 200: { description: "OK" } } } },
    "/__debug/env": { get: { summary: "Ver env (mask)", responses: { 200: { description: "OK" } } } },
    "/__debug/ping": { get: { summary: "Ping DB", responses: { 200: { description: "OK" } } } },
    "/characters": {
      get: { summary: "Lista personajes", responses: { 200: { description: "OK" } } },
      post: {
        summary: "Crea un personaje",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "image_url"], // image_url NOT NULL
                properties: {
                  name: { type: "string" },
                  display_name: { type: "string" },
                  image_url: { type: "string" },
                  age: { type: "number" },
                  height_cm: { type: "number" },
                  weight_kg: { type: "number" },
                  nen_type: { type: "string" },
                  role: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Creado" }, 400: { description: "Faltan datos" } },
      },
    },
    "/characters/{id}": {
      put: {
        summary: "Actualiza por ID (parcial)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  display_name: { type: "string" },
                  image_url: { type: "string" },
                  age: { type: "number" },
                  height_cm: { type: "number" },
                  weight_kg: { type: "number" },
                  nen_type: { type: "string" },
                  role: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Actualizado" }, 404: { description: "No encontrado" } },
      },
      delete: {
        summary: "Elimina por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 204: { description: "Eliminado" }, 404: { description: "No encontrado" } },
      },
    },
  },
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

/* ========== 3) RUTAS DEBUG & HEALTH ========== */
app.get("/health", (_req, res) => res.json({ status: "ok", service: "pg" }));

app.get("/__debug/env", (_req, res) => {
  const masked =
    DATABASE_URL.length > 20
      ? DATABASE_URL.slice(0, 20) + "..." + DATABASE_URL.slice(-10)
      : DATABASE_URL;
  res.json({
    NODE_ENV: process.env.NODE_ENV || null,
    PGSSL: process.env.PGSSL || "forced-true",
    DATABASE_URL_seen: masked,
    target: parsedHost,
  });
});

app.get("/__debug/ping", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({ ok: true, result: r.rows[0], target: parsedHost });
  } catch (e) {
    console.error("❌ DB ping error:", e);
    res.status(500).json({ ok: false, error: e.message, target: parsedHost });
  }
});

/* ========== 4) CRUD ========== */
// LIST
app.get("/characters", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description
       FROM public.characters
       ORDER BY id`
    );
    res.json(rows);
  } catch (e) {
    console.error("PG LIST error:", e);
    res.status(500).json({ error: "Error listando" });
  }
});

// CREATE
app.post("/characters", async (req, res) => {
  const {
    name,
    display_name = null,
    image_url,
    age = null,
    height_cm = null,
    weight_kg = null,
    nen_type = null,
    role = null,
    description = null,
  } = req.body || {};

  if (!name || !image_url) {
    return res.status(400).json({ error: "name e image_url son obligatorios" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.characters
       (name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description`,
      [name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("PG CREATE error:", e);
    res.status(500).json({ error: "Error creando" });
  }
});

// UPDATE parcial
app.put("/characters/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).send("id inválido");

  const allowed = [
    "name",
    "display_name",
    "image_url",
    "age",
    "height_cm",
    "weight_kg",
    "nen_type",
    "role",
    "description",
  ];

  const entries = Object.entries(req.body || {}).filter(
    ([k, v]) => allowed.includes(k) && v !== undefined
  );
  if (entries.length === 0) return res.status(400).send("Nada para actualizar");

  const set = entries.map(([k], i) => `${k}=$${i + 1}`).join(", ");
  const values = entries.map(([, v]) => v);
  values.push(id);

  const sql = `UPDATE public.characters SET ${set} WHERE id=$${values.length} RETURNING *;`;

  try {
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) return res.status(404).send("No encontrado");
    return res.json(rows[0]);
  } catch (e) {
    console.error("PG UPDATE error:", e);
    return res.status(500).send("Error del servidor");
  }
});

// DELETE
app.delete("/characters/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM public.characters WHERE id = $1`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: "No encontrado" });
    res.status(204).send();
  } catch (e) {
    console.error("PG DELETE error:", e);
    res.status(500).json({ error: "Error eliminando" });
  }
});

/* ========== 5) START ========== */
app.listen(PORT, () => {
  console.log(`API PG en http://localhost:${PORT}`);
  console.log("Swagger: /api-docs");
});
