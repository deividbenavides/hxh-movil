// server-pg/server.js
import express from "express";
import cors from "cors";
import pkg from "pg";
import swaggerUi from "swagger-ui-express";
const { Pool } = pkg;

// ===== 1) ENV =====
const PORT = process.env.PORT || 5001;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/hxh"; // ajusta si hace falta

const pool = new Pool({ connectionString: DATABASE_URL, ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false });

const app = express();
app.use(cors());
app.use(express.json());

// ===== 2) SWAGGER =====
const swaggerDoc = {
  openapi: "3.0.0",
  info: { title: "HXH API - PostgreSQL", version: "1.0.0" },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    "/health": { get: { summary: "Health", responses: { 200: { description: "OK" } } } },
    "/characters": {
      get: { summary: "Lista personajes", responses: { 200: { description: "OK" } } },
      post: {
        summary: "Crea un personaje",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name","displayName"], properties: {
          name:{type:"string"}, displayName:{type:"string"}, imageUrl:{type:"string"}, age:{type:"number"},
          height_cm:{type:"number"}, weight_kg:{type:"number"}, nen_type:{type:"string"}, role:{type:"string"}
        }}}}},
        responses: { 201: { description: "Creado" }, 400: { description: "Faltan datos" } },
      },
    },
    "/characters/{id}": {
      put: {
        summary: "Actualiza por ID",
        parameters: [{ name:"id", in:"path", required:true, schema:{type:"integer"} }],
        requestBody: { required:true, content: { "application/json": { schema:{ type:"object", additionalProperties:true }}}},
        responses: { 200: { description: "Actualizado" }, 404: { description: "No encontrado" } },
      },
      delete: {
        summary: "Elimina por ID",
        parameters: [{ name:"id", in:"path", required:true, schema:{type:"integer"} }],
        responses: { 204: { description: "Eliminado" }, 404: { description: "No encontrado" } },
      },
    },
  },
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ===== 3) HELPERS =====
const allowedCols = [
  "name","displayName","imageUrl","age","height_cm","weight_kg","nen_type","role",
];

// Mapear JS → columnas reales
const colMap = {
  name: "name",
  displayName: "displayname",
  imageUrl: "imageurl",
  age: "age",
  height_cm: "height_cm",
  weight_kg: "weight_kg",
  nen_type: "nen_type",
  role: "role",
};

function buildUpdate(payload) {
  const entries = Object.entries(payload).filter(([k, v]) => allowedCols.includes(k) && v !== undefined);
  if (!entries.length) return null;
  const sets = entries.map(([k], i) => `${colMap[k]} = $${i + 1}`);
  const values = entries.map(([, v]) => v);
  return { sets: sets.join(", "), values };
}

// ===== 4) ENDPOINTS =====
app.get("/health", (_req, res) => res.json({ status: "ok", service: "pg" }));

// LIST
app.get("/characters", async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, name, displayname, imageurl, age, height_cm, weight_kg, nen_type, role FROM characters ORDER BY id`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando" });
  }
});

// CREATE
app.post("/characters", async (req, res) => {
  const { name, displayName, imageUrl, age, height_cm, weight_kg, nen_type, role } = req.body || {};
  if (!name || !displayName) return res.status(400).json({ error: "name y displayName requeridos" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO characters (name, displayname, imageurl, age, height_cm, weight_kg, nen_type, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, name, displayname, imageurl, age, height_cm, weight_kg, nen_type, role`,
      [name, displayName, imageUrl ?? null, age ?? null, height_cm ?? null, weight_kg ?? null, nen_type ?? null, role ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando" });
  }
});

// UPDATE
app.put("/characters/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

  const upd = buildUpdate(req.body || {});
  if (!upd) return res.status(400).json({ error: "Nada para actualizar" });

  try {
    const { rows } = await pool.query(
      `UPDATE characters SET ${upd.sets} WHERE id = $${upd.values.length + 1}
       RETURNING id, name, displayname, imageurl, age, height_cm, weight_kg, nen_type, role`,
      [...upd.values, id]
    );
    if (!rows.length) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando" });
  }
});

// DELETE
app.delete("/characters/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const { rowCount } = await pool.query(`DELETE FROM characters WHERE id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ error: "No encontrado" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error eliminando" });
  }
});

// ===== 5) START =====
app.listen(PORT, () => {
  console.log(`API PG en http://localhost:${PORT}`);
  console.log("Swagger: /api-docs");
});
