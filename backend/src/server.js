import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Firebase Setup using environment variable ---
const firebaseCredentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

// --- Express Setup ---
const app = express();
app.use(express.json());

// If frontend build is located in ../dist (Vite or CRA build output)
app.use(express.static(path.join(__dirname, '../dist')));
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- CORS (optional but recommended) ---
app.use(cors({
  origin: process.env.ORIGIN || '*',
  credentials: true,
}));

// --- MongoDB Setup ---
let db;
async function connectToDb() {
  const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: ServerApiVersion.v1,
  });

  await client.connect();
  db = client.db('full-stack-db');
  console.log('✅ MongoDB Connected');
}

// --- Decode user auth ---
async function decodeUser(req, res, next) {
  const authtoken = req.headers.authtoken;
  if (authtoken) {
    try {
      req.user = await admin.auth().verifyIdToken(authtoken);
    } catch (err) {
      req.user = null;
    }
  }
  next();
}
app.use(decodeUser);

function authRequired(req, res, next) {
  if (!req.user) return res.sendStatus(401);
  next();
}

// --- ROUTES ---
app.get('/api/articles/:name', async (req, res) => {
  const { name } = req.params;
  const article = await db.collection('articles').findOne({ name });
  res.json(article);
});

app.post('/api/articles/:name/upvote', authRequired, async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;

  const article = await db.collection('articles').findOne({ name });
  const canUpvote = uid && !(article.upvoteIds || []).includes(uid);

  if (!canUpvote) return res.sendStatus(403);

  const updated = await db.collection('articles').findOneAndUpdate(
    { name },
    { $inc: { upvotes: 1 }, $push: { upvoteIds: uid } },
    { returnDocument: 'after' }
  );

  res.json(updated.value);
});

app.post('/api/articles/:name/comments', authRequired, async (req, res) => {
  const { name } = req.params;
  const { postedBy, text } = req.body;

  const updated = await db.collection('articles').findOneAndUpdate(
    { name },
    { $push: { comments: { postedBy, text } } },
    { returnDocument: 'after' }
  );

  res.json(updated.value);
});

// --- Start Server ---
const port = process.env.PORT || 3000;
async function start() {
  await connectToDb();
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
}
start();
