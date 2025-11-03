// server-mongo/server.js
import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
import swaggerUi from "swagger-ui-express";

// 1. LEER VARIABLES DE ENTORNO (Render y local)
const PORT = process.env.PORT || 5002;
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://hxh_user:HxHpass_2025@cluster0.s1cs0k0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGO_DB = process.env.MONGO_DB || "hxhdb";
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || "characters";

// 2. CLIENTE MONGO con opciones para Atlas
const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: false,
  },
  tls: true, // ayuda en Render
});

const app = express();
app.use(cors());
app.use(express.json());

// 3. DOC SWAGGER (aquí ya meto GET y POST)
const swaggerDoc = {
  openapi: "3.0.0",
  info: {
    title: "Hunter x Hunter API - MongoDB",
    version: "1.0.0",
    description: "CRUD de personajes (parte no relacional, Mongo Atlas)",
  },
  servers: [
    // esto es para que en local se vea bien
    { url: `http://localhost:${PORT}` },
    // en Render él mismo pone el dominio real
  ],
  paths: {
    "/health": {
      get: {
        summary: "Chequeo del servicio",
        responses: {
          200: {
            description: "OK",
          },
        },
      },
    },
    "/characters": {
      get: {
        summary: "Lista los personajes (Mongo)",
        responses: {
          200: {
            description: "Lista de personajes",
          },
        },
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
                  name: { type: "string", example: "gon" },
                  displayName: { type: "string", example: "Gon Freecss" },
                  age: { type: "integer", example: 12 },
                  height_cm: { type: "integer", example: 154 },
                  weight_kg: { type: "integer", example: 49 },
                  nen_type: { type: "string", example: "Refuerzo" },
                  role: { type: "string", example: "Hunter" },
                  imageUrl: {
                    type: "string",
                    example: "https://mis-imagenes.com/gon.png",
                  },
                },
                required: ["name"],
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

// montar swagger en /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// 4. ENDPOINTS REALES
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "mongo" });
});

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

// 👉 nuevo: POST para insertar desde Swagger
app.post("/characters", async (req, res) => {
  try {
    const db = client.db(MONGO_DB);
    const col = db.collection(MONGO_COLLECTION);

    const nuevo = req.body;

    // validación mínima
    if (!nuevo.name) {
      return res.status(400).json({ error: "El campo 'name' es obligatorio" });
    }

    const result = await col.insertOne(nuevo);
    return res.status(201).json({ _id: result.insertedId, ...nuevo });
  } catch (err) {
    console.error("POST /characters error:", err);
    res.status(500).json({ error: "Error insertando en Mongo" });
  }
});

// 5. CONEXIÓN A MONGO + LEVANTAR SERVIDOR
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
    // aun así levantamos la API para que Render no la marque como caída
    app.listen(PORT, () => {
      console.log(
        `API Mongo levantada SIN conexión a Mongo, en http://localhost:${PORT}`
      );
    });
  }
}

start();
