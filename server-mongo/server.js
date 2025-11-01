// hxh-app/server-mongo/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB || "hxhdb";
const collectionName = process.env.MONGO_COLLECTION || "characters";

let collection; // aquí guardamos la colección real

async function connectMongo() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  collection = db.collection(collectionName);
  console.log("✅ Conectado a Mongo Atlas →", dbName, "/", collectionName);
}

// swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hunter x Hunter API - Mongo",
      version: "1.0.0",
      description: "Personajes no relacionales (Mongo Atlas)",
    },
    servers: [
      {
        url: process.env.PUBLIC_URL || "http://localhost:5002",
      },
    ],
  },
  apis: ["./server.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (_req, res) => res.send("ok"));

app.get("/characters", async (_req, res) => {
  try {
    const docs = await collection.find({}).project({ _id: 0 }).toArray();
    res.status(200).json(docs);
  } catch (err) {
    console.error("GET /characters", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// sembrar data de ejemplo
app.get("/seed", async (_req, res) => {
  try {
    const count = await collection.countDocuments();
    if (count > 0) {
      return res.json({ ok: true, message: "Ya había datos, no se sembró de nuevo", count });
    }

    const docs = [
      {
        name: "netero",
        displayName: "Isaac Netero",
        age: 110,
        height_cm: 160,
        weight_kg: 55,
        imageUrl: "https://static.wikia.nocookie.net/hunterxhunter/images/d/d9/Chairman_Netero.png",
        nen_type: "Refuerzo",
        role: "Presidente Asociación Hunter",
      },
      {
        name: "meruem",
        displayName: "Meruem",
        age: 40,
        height_cm: 160,
        weight_kg: 65,
        imageUrl: "https://static.wikia.nocookie.net/hunterxhunter/images/7/72/Meruem.png",
        nen_type: "Especialista",
        role: "Rey Hormiga Quimera",
      },
      {
        name: "neferpitou",
        displayName: "Neferpitou",
        age: null,
        height_cm: 175,
        weight_kg: 60,
        imageUrl: "https://static.wikia.nocookie.net/hunterxhunter/images/1/12/Neferpitou.png",
        nen_type: "Especialista",
        role: "Guardián real",
      },
      {
        name: "knuckle",
        displayName: "Knuckle Bine",
        age: 28,
        height_cm: 185,
        weight_kg: 82,
        imageUrl: "https://static.wikia.nocookie.net/hunterxhunter/images/8/88/Knuckle.png",
        nen_type: "Refuerzo",
        role: "Cazador",
      },
      {
        name: "bisky",
        displayName: "Biscuit Krueger",
        age: 57,
        height_cm: 160,
        weight_kg: 48,
        imageUrl: "https://static.wikia.nocookie.net/hunterxhunter/images/f/fe/Biscuit_Krueger.png",
        nen_type: "Transformación",
        role: "Maestra de Gon y Killua",
      },
      {
        name: "kite",
        displayName: "Kite",
        age: 25,
        height_cm: 183,
        weight_kg: 75,
        imageUrl: "https://static.wikia.nocookie.net/hunterxhunter/images/9/9a/Kite.png",
        nen_type: "Conjuración",
        role: "Discípulo de Ging",
      },
    ];

    await collection.insertMany(docs);
    res.json({ ok: true, inserted: docs.length });
  } catch (err) {
    console.error("GET /seed", err);
    res.status(500).json({ error: "No se pudo sembrar" });
  }
});

const port = Number(process.env.PORT || 5002);

connectMongo().then(() => {
  app.listen(port, () => {
    console.log(`🚀 API Mongo escuchando en http://localhost:${port}`);
    console.log(`📄 Swagger en http://localhost:${port}/api-docs`);
  });
});
