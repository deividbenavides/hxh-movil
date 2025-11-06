// server-pg/server.js
import express from "express";
import cors from "cors";
import pkg from "pg";
import swaggerUi from "swagger-ui-express";
const { Pool } = pkg;

/* =========================
 * 1) ENV & DB
 * ========================= */
const PORT = process.env.PORT || 5001;

// Usa la DB de Render si existe, si no, tu local
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/hxh";

const pool = new Pool({
  connectionString: DATABASE_URL,
  // En Render debes tener PGSSL=true en Variables de entorno
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
});

/* =========================
 * 2) APP & MIDDLEWARES
 * ========================= */
const app = express();
app.use(cors());
app.use(express.json());

/* =========================
 * 3) SWAGGER (mismo spec)
 * ========================= */
// NOTA: server URL como "/" para que funcione tanto local como en Render.
const swaggerDoc = {
  openapi: "3.0.0",
  info: { title: "HXH API - PostgreSQL", version: "1.0.0" },
  servers: [{ url: "/" }],
  paths: {
    "/health": {
      get: { summary: "Health", responses: { 200: { description: "OK" } } },
    },
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
                // En la tabla image_url es NOT NULL, por eso es requerido
                required: ["name", "image_url"],
                properties: {
                  // Aceptamos snake_case en el spec, pero la API tolera camelCase también
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
        responses: {
          201: { description: "Creado" },
          400: { description: "Faltan datos" },
        },
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

/* =========================
 * 4) ENDPOINTS
 * ========================= */

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", service: "pg" }));

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

// CREATE (acepta snake_case y camelCase en el body)
app.post("/characters", async (req, res) => {
  const b = req.body || {};
  // Normalizamos: si viene camelCase lo mapeamos
  const name        = b.name;
  const displayName = b.display_name ?? b.displayName ?? null;
  const imageUrl    = b.image_url   ?? b.imageUrl;
  const age         = b.age ?? null;
  const height_cm   = b.height_cm ?? b.heightCm ?? null;
  const weight_kg   = b.weight_kg ?? b.weightKg ?? null;
  const nen_type    = b.nen_type ?? b.nenType ?? null;
  const role        = b.role ?? null;
  const description = b.description ?? null;

  if (!name || !imageUrl) {
    return res.status(400).json({ error: "name e image_url son obligatorios" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.characters
       (name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description`,
      [name, displayName, imageUrl, age, height_cm, weight_kg, nen_type, role, description]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("PG CREATE error:", e);
    res.status(500).json({ error: "Error creando" });
  }
});

// UPDATE (solo este bloque es “nuevo”; soporta snake_case y camelCase)
app.put("/characters/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).send("id inválido");

  const b = req.body || {};
  const normalized = {
    name:         b.name ?? b.Name,
    display_name: b.display_name ?? b.displayName,
    image_url:    b.image_url ?? b.imageUrl,
    age:          b.age,
    height_cm:    b.height_cm ?? b.heightCm,
    weight_kg:    b.weight_kg ?? b.weightKg,
    nen_type:     b.nen_type ?? b.nenType,
    role:         b.role,
    description:  b.description,
  };

  const allowed = [
    "name", "display_name", "image_url", "age",
    "height_cm", "weight_kg", "nen_type", "role", "description",
  ];

  const entries = Object.entries(normalized).filter(([k, v]) => allowed.includes(k) && v !== undefined);
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

/* =========================
 * 5) START
 * ========================= */
app.listen(PORT, () => {
  console.log(`API PG en http://localhost:${PORT}`);
  console.log("Swagger: /api-docs");
});
