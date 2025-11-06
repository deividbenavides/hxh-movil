// server-pg/server.js
import express from "express";
import cors from "cors";
import pkg from "pg";
import swaggerUi from "swagger-ui-express";
const { Pool } = pkg;

/* ========== 1) ENV ========== */
const PORT = process.env.PORT || 5001;

// En Render, usa sí o sí la DATABASE_URL del servicio.
// En local, si no está definida, cae a tu postgres local.
const LOCAL_FALLBACK = "postgresql://postgres:postgres@localhost:5432/hxh";
const IS_RENDER = !!process.env.RENDER;
const DATABASE_URL = process.env.DATABASE_URL || (!IS_RENDER ? LOCAL_FALLBACK : null);

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está definida en el servicio de Render.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: IS_RENDER ? { rejectUnauthorized: false } : false,
});

// Log NO sensible (solo host y db) para validar a dónde conecta
try {
  const u = new URL(DATABASE_URL);
  console.log("🔌 DB host:", u.hostname, "DB name:", u.pathname.replace("/", ""));
} catch {}

/* ========== 2) APP & SWAGGER ========== */
const app = express();
app.use(cors());
app.use(express.json());

// Usamos "/" para que Swagger funcione igual en local y Render
const swaggerDoc = {
  openapi: "3.0.0",
  info: { title: "HXH API - PostgreSQL", version: "1.0.0" },
  servers: [{ url: "/" }],
  paths: {
    "/health": { get: { summary: "Health", responses: { 200: { description: "OK" } } } },
    "/diag": { get: { summary: "Diag (host/db)", responses: { 200: { description: "OK" } } } },
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
                required: ["name", "image_url"], // image_url es NOT NULL en tu tabla
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
              examples: {
                ejemplo: {
                  value: {
                    name: "Gon",
                    display_name: "Gon Freecss",
                    image_url: "https://example.com/gon.png",
                    age: 12,
                    height_cm: 154,
                    weight_kg: 49,
                    nen_type: "Refuerzo",
                    role: "Hunter",
                    description: "Prota de HxH",
                  },
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
        summary: "Actualiza por ID (parcial, snake_case)",
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
              examples: {
                ejemplo: { value: { display_name: "Gon Freecss (Editado)" } },
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

/* ========== 3) ENDPOINTS ========== */
app.get("/health", (_req, res) => res.json({ status: "ok", service: "pg" }));
app.get("/diag", (_req, res) => {
  try {
    const u = new URL(DATABASE_URL);
    res.json({ host: u.hostname, db: u.pathname.replace("/", ""), ssl: !!(IS_RENDER) });
  } catch {
    res.json({ host: "unknown" });
  }
});

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

// UPDATE (dinámico, snake_case)
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
  if (!entries.length) return res.status(400).send("Nada para actualizar");

  const set = entries.map(([k], i) => `${k}=$${i + 1}`).join(", ");
  const values = entries.map(([, v]) => v);
  values.push(id);

  const sql = `UPDATE public.characters SET ${set} WHERE id=$${values.length} RETURNING *`;

  try {
    const { rows } = await pool.query(sql, values);
    if (!rows.length) return res.status(404).send("No encontrado");
    res.json(rows[0]);
  } catch (e) {
    console.error("PG UPDATE error:", e);
    res.status(500).send("Error del servidor");
  }
});

// DELETE
app.delete("/characters/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const { rowCount } = await pool.query(`DELETE FROM public.characters WHERE id=$1`, [id]);
    if (!rowCount) return res.status(404).json({ error: "No encontrado" });
    res.status(204).send();
  } catch (e) {
    console.error("PG DELETE error:", e);
    res.status(500).json({ error: "Error eliminando" });
  }
});

/* ========== 4) START ========== */
app.listen(PORT, () => {
  console.log(`API PG en http://localhost:${PORT}`);
  console.log("Swagger: /api-docs");
});
