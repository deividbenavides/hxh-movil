// server-mongo/server.js
import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import swaggerUi from "swagger-ui-express";

// ===== ENV =====
const PORT = process.env.PORT || 5002;
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://hxh_user:HxHpass_2025@cluster0.s1cs0k0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGO_DB = process.env.MONGO_DB || "hxhdb";
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || "characters";

// ===== CLIENT =====
const client = new MongoClient(MONGO_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: false },
  tls: true,
});

const app = express();
app.use(cors());
app.use(express.json());

// ===== SWAGGER =====
const swaggerDoc = {
  openapi: "3.0.0",
  info: {
    title: "HXH API - MongoDB",
    version: "1.0.0",
    description: "CRUD de personajes en MongoDB Atlas",
  },
  // IMPORTANTE: base relativa para que funcione en Render y local
  servers: [{ url: "/" }],
  components: {
    schemas: {
      Character: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66f9f6c1e2a4d3c3f3d9a111" },
          name: { type: "string", example: "gon" },
          displayName: { type: "string", example: "Gon Freecss" },
          imageUrl: { type: "string", example: "https://mi-img/gon.png" },
          age: { type: "number", example: 12 },
          height_cm: { type: "number", example: 154 },
          weight_kg: { type: "number", example: 49 },
          nen_type: { type: "string", example: "Refuerzo" },
          role: { type: "string", example: "Hunter" },
        },
      },
      CreateCharacter: {
        type: "object",
        required: ["name", "displayName"],
        properties: {
          name: { type: "string" },
          displayName: { type: "string" },
          imageUrl: { type: "string" },
          age: { type: "number" },
          height_cm: { type: "number" },
          weight_kg: { type: "number" },
          nen_type: { type: "string" },
          role: { type: "string" },
        },
      },
      UpdateCharacter: {
        type: "object",
        additionalProperties: true,
        properties: {
          name: { type: "string" },
          displayName: { type: "string" },
          imageUrl: { type: "string" },
          age: { type: "number" },
          height_cm: { type: "number" },
          weight_kg: { type: "number" },
          nen_type: { type: "string" },
          role: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: { summary: "Health", responses: { 200: { description: "OK" } } },
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
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCharacter" } } },
        },
        responses: { 201: { description: "Creado" }, 400: { description: "Faltan datos" } },
      },
    },
    "/characters/{id}": {
      put: {
        summary: "Actualiza por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateCharacter" } } },
        },
        responses: { 200: { description: "Actualizado" }, 400: { description: "Solicitud inválida" }, 404: { description: "No encontrado" } },
      },
      delete: {
        summary: "Elimina por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Eliminado" }, 400: { description: "Solicitud inválida" }, 404: { description: "No encontrado" } },
      },
    },
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ===== HELPERS =====
const col = () => client.db(MONGO_DB).collection(MONGO_COLLECTION);
const toId = (id) => {
  try { return new ObjectId(id); } catch { return null; }
};

// ===== ENDPOINTS =====
app.get("/health", (_req, res) => res.json({ status: "ok", service: "mongo" }));

// LIST
app.get("/characters", async (_req, res) => {
  try {
    const data = await col().find({}).toArray();
    res.json(data);
  } catch (e) {
    console.error("GET /characters error:", e);
    res.status(500).json({ error: "Error listando" });
  }
});

// CREATE
app.post("/characters", async (req, res) => {
  const { name, displayName, ...rest } = req.body || {};
  if (!name || !displayName) return res.status(400).json({ error: "name y displayName requeridos" });

  try {
    const r = await col().insertOne({ name, displayName, ...rest });
    res.status(201).json({ _id: r.insertedId, name, displayName, ...rest });
  } catch (e) {
    console.error("POST /characters error:", e);
    res.status(500).json({ error: "Error creando" });
  }
});

// UPDATE (versión robusta: updateOne + findOne)
app.put("/characters/:id", async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) return res.status(400).json({ error: "ID inválido" });

  const allowed = [
    "name",
    "displayName",
    "imageUrl",
    "age",
    "height_cm",
    "weight_kg",
    "nen_type",
    "role",
  ];

  const payload = Object.fromEntries(
    Object.entries(req.body || {}).filter(([k, v]) => allowed.includes(k) && v !== undefined)
  );

  if (!Object.keys(payload).length) {
    return res.status(400).json({ error: "Nada para actualizar" });
  }

  try {
    const upd = await col().updateOne({ _id }, { $set: payload });

    if (upd.matchedCount === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }

    // Leer y devolver el documento actualizado
    const updated = await col().findOne({ _id });
    return res.status(200).json(updated);
  } catch (e) {
    console.error("PUT /characters/:id error:", e);
    return res.status(500).json({ error: "Error actualizando" });
  }
});


// DELETE
app.delete("/characters/:id", async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) return res.status(400).json({ error: "ID inválido" });

  try {
    const r = await col().deleteOne({ _id });
    if (!r.deletedCount) return res.status(404).json({ error: "No encontrado" });
    res.status(204).send();
  } catch (e) {
    console.error("DELETE /characters/:id error:", e);
    res.status(500).json({ error: "Error eliminando" });
  }
});

// ===== START =====
async function start() {
  try {
    console.log("⏳ Conectando a Mongo…");
    await client.connect();
    console.log("✅ Mongo listo");
  } catch (e) {
    console.error("❌ No conectó Mongo:", e?.message);
  } finally {
    app.listen(PORT, () => {
      console.log(`API Mongo en http://localhost:${PORT}`);
      console.log(`Swagger en http://localhost:${PORT}/api-docs`);
    });
  }
}
start();
