// server-pg/server.js
import express from "express";
import cors from "cors";
import pkg from "pg";
import swaggerUi from "swagger-ui-express";

const { Pool } = pkg;

// ===== 1) ENV / DB =====
const PORT = process.env.PORT || 5001;

// Usa la URL que tengas configurada en Render en la variable DATABASE_URL.
// Si estás en Render, deja SSL activo; en local lo puedes desactivar.
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/hxh";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    process.env.PGSSL === "false" || process.env.NODE_ENV === "development"
      ? false
      : { rejectUnauthorized: false },
});

const app = express();
app.use(cors());
app.use(express.json());

// ===== 2) SWAGGER =====
const swaggerDoc = {
  openapi: "3.0.0",
  info: { title: "HXH API - PostgreSQL", version: "1.0.0" },
  servers: [
    { url: "/" }, // relativo; funciona en local y en Render
  ],
  paths: {
    "/health": {
      get: {
        summary: "Healthcheck",
        responses: { 200: { description: "OK" } },
      },
    },
    "/characters": {
      get: {
        summary: "Lista personajes",
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Crea un personaje",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "display_name"],
                properties: {
                  name: { type: "string" },
                  display_name: { type: "string" },
                  image_url: { type: "string" },
                  age: { type: "integer" },
                  height_cm: { type: "integer" },
                  weight_kg: { type: "integer" },
                  nen_type: { type: "string" },
                  role: { type: "string" },
                  description: { type: "string" },
                },
              },
              example: {
                name: "gon",
                display_name: "Gon Freecss",
                image_url: "https://example.com/gon.png",
                age: 12,
                height_cm: 154,
                weight_kg: 49,
                nen_type: "Refuerzo",
                role: "Hunter",
                description: "Prota de HXH",
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
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
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
                  age: { type: "integer" },
                  height_cm: { type: "integer" },
                  weight_kg: { type: "integer" },
                  nen_type: { type: "string" },
                  role: { type: "string" },
                  description: { type: "string" },
                },
              },
              example: { display_name: "Gon Freecss (Editado 2.3)" },
            },
          },
        },
        responses: {
          200: { description: "Actualizado" },
          400: { description: "Nada para actualizar / id inválido" },
          404: { description: "No encontrado" },
          500: { description: "Error del servidor" },
        },
      },
      delete: {
        summary: "Elimina por ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          204: { description: "Eliminado" },
          404: { description: "No encontrado" },
        },
      },
    },
  },
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ===== 3) ENDPOINTS =====
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "pg" })
);

// LIST
app.get("/characters", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description
      FROM public.characters
      ORDER BY id
    `);
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
    display_name,
    image_url,
    age,
    height_cm,
    weight_kg,
    nen_type,
    role,
    description,
  } = req.body || {};

  if (!name || !display_name) {
    return res.status(400).json({ error: "name y display_name son obligatorios" });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO public.characters
        (name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id, name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description
      `,
      [
        name,
        display_name,
        image_url ?? null,
        age ?? null,
        height_cm ?? null,
        weight_kg ?? null,
        nen_type ?? null,
        role ?? null,
        description ?? null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("PG CREATE error:", e);
    res.status(500).json({ error: "Error creando" });
  }
});

// UPDATE (parcial)
app.put("/characters/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).send("id inválido");
  }

  // Campos válidos (coinciden con la vista public.characters)
  const allowed = new Set([
    "name",
    "display_name",
    "image_url",
    "age",
    "height_cm",
    "weight_kg",
    "nen_type",
    "role",
    "description",
  ]);

  const entries = Object.entries(req.body || {}).filter(
    ([k, v]) => allowed.has(k) && v !== undefined
  );
  if (entries.length === 0) {
    return res.status(400).send("Nada para actualizar");
  }

  const setClauses = [];
  const values = [];
  entries.forEach(([key, value], i) => {
    setClauses.push(`${key} = $${i + 1}`);
    values.push(value);
  });

  values.push(id);
  const sql = `
    UPDATE public.characters
    SET ${setClauses.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, name, display_name, image_url, age, height_cm, weight_kg, nen_type, role, description
  `;

  try {
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) return res.status(404).send("No encontrado");
    return res.json(rows[0]);
  } catch (e) {
    console.error("PG UPDATE error:", e.stack || e.message || e);
    return res.status(500).send("Error del servidor");
  }
});

// DELETE
app.delete("/characters/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

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

// ===== 4) START =====
app.listen(PORT, () => {
  console.log(`API PG en http://localhost:${PORT}`);
  console.log("Swagger: /api-docs");
});
