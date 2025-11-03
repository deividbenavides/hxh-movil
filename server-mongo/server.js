// server-mongo/server.js
import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
import swaggerUi from "swagger-ui-express";

// 1. VARIABLES DE ENTORNO (Render y local)
const PORT = process.env.PORT || 5002;
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://hxh_user:HxHpass_2025@cluster0.s1cs0k0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGO_DB = process.env.MONGO_DB || "hxhdb";         // 👈 igual que en Atlas
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || "characters"; // 👈 tu colección

// 2. CLIENTE MONGO
const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: false,
  },
  tls: true,
});

const app = express();
app.use(cors());
app.use(express.json());

// 3. SWAGGER
const swaggerDoc = {
  openapi: "3.0.0",
  info: {
    title: "Hunter x Hunter API - MongoDB",
    version: "1.0.0",
    description: "CRUD de personajes (Mongo Atlas)",
  },
  servers: [
    { url: `http://localhost:${PORT}` }, // local
    { url: "https://hxh-mongo.onrender.com" }, // 👈 tu URL de Render
  ],
  paths: {
    "/health": {
      get: {
        summary: "Chequeo del servicio",
        responses: { 200: { description: "OK" } },
      },
    },
    "/characters": {
      get: {
        summary: "Lista los personajes (Mongo)",
        responses: { 200: { description: "Lista de personajes" } },
      },
      post: {
        summary: "Crea un personaje en Mongo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  displayName: { type: "string" },
                  age: { type: "number" },
                  height_cm: { type: "number" },
                  weight_kg: { type: "number" },
                  nen_type: { type: "string" },
                  role: { type: "string" },
                  imageUrl: { type: "string" },
                },
                required: ["name", "displayName"],
              },
              example: {
                name: "gon",
                displayName: "Gon Freecss",
                age: 12,
                height_cm: 154,
                weight_kg: 49,
                nen_type: "Refuerzo",
                role: "Hunter",
                imageUrl: "https://mis-imagenes.com/gon.png",
              },
            },
          },
        },
        responses: {
          201: { description: "Personaje creado" },
          400: { description: "Faltan datos" },
        },
      },
    },
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// 4. ENDPOINTS REALES

// ping
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "mongo" });
});

// listar
app.get("/characters", async (req, res) => {
  try {
    const db = client.db(MONGO_DB);
    const col = db.collection(MONGO_COLLECTION);
    const data = await col.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error("GET /characters error:", err);
    res.status(500).json({ error: "Error consultando Mongo" });
  }
});

// crear
app.post("/characters", async (req, res) => {
  try {
    const body = req.body;

    // validación mínima
    if (!body || !body.name || !body.displayName) {
      return res.status(400).json({ error: "name y displayName son obligatorios" });
    }

    const db = client.db(MONGO_DB);
    const col = db.collection(MONGO_COLLECTION);
    const result = await col.insertOne(body);

    return res.status(201).json({
      message: "Personaje creado",
      id: result.insertedId,
    });
  } catch (err) {
    console.error("POST /characters error:", err);
    res.status(500).json({ error: "Error insertando en Mongo" });
  }
});

// 5. ARRANCAR
async function start() {
  try {
    console.log("⏳ Conectando a Mongo Atlas…");
    await client.connect();
    console.log("✅ Conectado a Mongo Atlas");

    app.listen(PORT, () => {
      console.log(`API Mongo escuchando en http://localhost:${PORT}`);
      console.log(`Swagger Mongo en http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("❌ No se pudo conectar a Mongo Atlas:", err.message);
    app.listen(PORT, () => {
      console.log(
        `API Mongo levantada SIN conexión a Mongo, en http://localhost:${PORT}`
      );
    });
  }
}

start();
