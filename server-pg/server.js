// hxh-app/server-pg/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// conexión a Postgres (Render)
const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});


// Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hunter x Hunter API - PostgreSQL",
      version: "1.0.0",
      description: "CRUD de personajes (parte relacional, Postgres en Render)",
    },
    servers: [
      {
        url: process.env.PUBLIC_URL || "http://localhost:5001",
      },
    ],
  },
  apis: ["./server.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Chequeo del servicio
 *     responses:
 *       200:
 *         description: ok
 */
app.get("/health", (_req, res) => {
  res.send("ok");
});

/**
 * @swagger
 * /characters:
 *   get:
 *     summary: Lista todos los personajes (PostgreSQL)
 */
app.get("/characters", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM hxh_characters ORDER BY id");
    res.json(rows);
  } catch (err) {
    console.error("GET /characters", err);
    res.status(500).send("Error del servidor");
  }
});

/**
 * @swagger
 * /characters/{id}:
 *   get:
 *     summary: Obtiene un personaje por ID
 */
app.get("/characters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM hxh_characters WHERE id=$1", [id]);
    if (!rows.length) return res.status(404).send("No encontrado");
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /characters/:id", err);
    res.status(500).send("Error del servidor");
  }
});

/**
 * @swagger
 * /characters:
 *   post:
 *     summary: Crea un personaje
 */
app.post("/characters", async (req, res) => {
  try {
    const { name, age, height_cm, weight_kg, image_url, description } = req.body;
    if (!name || !image_url) return res.status(400).send("name e image_url son obligatorios");

    const { rows } = await pool.query(
      "INSERT INTO hxh_characters (name, age, height_cm, weight_kg, image_url, description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [name, age, height_cm, weight_kg, image_url, description]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /characters", err);
    res.status(500).send("Error del servidor");
  }
});

/**
 * @swagger
 * /characters/{id}:
 *   put:
 *     summary: Actualiza un personaje
 */
app.put("/characters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, height_cm, weight_kg, image_url, description } = req.body;

    const { rows } = await pool.query(
      "UPDATE hxh_characters SET name=$1, age=$2, height_cm=$3, weight_kg=$4, image_url=$5, description=$6 WHERE id=$7 RETURNING *",
      [name, age, height_cm, weight_kg, image_url, description, id]
    );
    if (!rows.length) return res.status(404).send("No encontrado");
    res.json(rows[0]);
  } catch (err) {
    console.error("PUT /characters/:id", err);
    res.status(500).send("Error del servidor");
  }
});

/**
 * @swagger
 * /characters/{id}:
 *   delete:
 *     summary: Elimina un personaje
 */
app.delete("/characters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query("DELETE FROM hxh_characters WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).send("No encontrado");
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /characters/:id", err);
    res.status(500).send("Error del servidor");
  }
});

const port = Number(process.env.PORT || 5001);
app.listen(port, () => {
  console.log(`API PG escuchando en http://localhost:${port}`);
  console.log(`Swagger PG en http://localhost:${port}/api-docs`);
});
