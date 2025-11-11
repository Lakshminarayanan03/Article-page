// src/server.js
import express from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion } from 'mongodb';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Firebase Admin init (env-first, file fallback for local) ----
let firebaseCred = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Render: whole JSON pasted as a single line
  firebaseCred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (fs.existsSync(path.join(__dirname, 'credentials.json'))) {
  firebaseCred = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')));
}

if (!admin.apps.length && firebaseCred) {
  admin.initializeApp({ credential: admin.credential.cert(firebaseCred) });
} else if (!firebaseCred) {
  console.warn('⚠️  No Firebase credentials found. Auth-only routes will fail.');
}

// ---- Express app ----
const app = express();
app.use(express.json());

// ---- CORS ----
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true, // true => reflect request origin
    credentials: true,
  })
);

// ---- MongoDB ----
const MONGO_URI =
  process.env.MONGO_URI && process.env.MONGO_URI.trim().length
    ? process.env.MONGO_URI
    : 'mongodb://127.0.0.1:27017';

let db;
async function connectToDb() {
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client.connect();
  db = client.db('full-stack-db'); // or use process.env.DB_NAME if you prefer
  console.log('✅ MongoDB Connected');
}

// ---- Public API routes ----
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/articles/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const article = await db.collection('articles').findOne({ name });
    res.json(article || null);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

// ---- Auth middleware for protected routes ----
async function authRequired(req, res, next) {
  try {
    if (!firebaseCred) return res.sendStatus(503); // service unavailable: no Firebase
    const header = req.headers.authtoken || req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    if (!token) return res.sendStatus(401);
    const user = await admin.auth().verifyIdToken(token);
    req.user = user;
    next();
  } catch (err) {
    return res.sendStatus(401);
  }
}

// ---- Protected API routes ----
app.post('/api/articles/:name/upvote', authRequired, async (req, res) => {
  try {
    const { name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });
    if (!article) return res.sendStatus(404);

    const upvoteIds = article.upvoteIds || [];
    const canUpvote = uid && !upvoteIds.includes(uid);

    if (!canUpvote) return res.sendStatus(403);

    const result = await db.collection('articles').findOneAndUpdate(
      { name },
      { $inc: { upvotes: 1 }, $push: { upvoteIds: uid } },
      { returnDocument: 'after' }
    );

    res.json(result.value || result);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.post('/api/articles/:name/comments', authRequired, async (req, res) => {
  try {
    const { name } = req.params;
    const { postedBy, text } = req.body;
    const newComment = { postedBy, text };

    const result = await db.collection('articles').findOneAndUpdate(
      { name },
      { $push: { comments: newComment } },
      { returnDocument: 'after' }
    );

    res.json(result.value || result);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

// ---- Optional: serve frontend build (only if you really want one service) ----
if (process.env.SERVE_STATIC === 'true') {
  const distDir = process.env.FRONTEND_DIST_DIR
    ? path.resolve(__dirname, process.env.FRONTEND_DIST_DIR)
    : path.resolve(__dirname, '../dist');

  if (fs.existsSync(distDir) && fs.existsSync(path.join(distDir, 'index.html'))) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api).+/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.warn(
      `⚠️  Static dir not found (${distDir}). Set FRONTEND_DIST_DIR correctly or disable SERVE_STATIC.`
    );
  }
}

// ---- Start ----
const port = process.env.PORT || 3000;
async function start() {
  await connectToDb();
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}
start();
