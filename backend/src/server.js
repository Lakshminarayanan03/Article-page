
import express from 'express'
import{ MongoClient, ServerApiVersion } from 'mongodb'

import admin from 'firebase-admin'
import fs from 'fs'

import { fileURLToPath } from 'url'
import path from 'path'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(
fs.readFileSync('./credentials.json')
)

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

const app = express();


let db;
async function connectToDb(){
    const uri = !process.env.MONGO_USERNAME
    ? 'mongodb://127.0.0.1:27017'
    : 'mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.krq1qmw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

    const client = new MongoClient(uri,{
        serverApi:{
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    })
    await client.connect();

    db = client.db('full-stack-db');
}

app.use(express.static(path.join(__dirname,'../dist')));

app.get(/^(?!\/api).+/, (req,res) =>{
    res.sendFile(path.join(__dirname, '../dist/index.html'))
}) 

app.use(express.json());

app.get('/api/articles/:name', async (req,res) =>{
     const {name} = req.params;
     const article = await db.collection('articles').findOne({ name });

     res.json(article);
})

app.use(async function (req,res,next) {
    const { authtoken } = req.headers

    if(authtoken){
        const user = await admin.auth().verifyIdToken(authtoken);
        req.user = user;
        next();
    }
    else{
        res.sendStatus(400);
    }
})
app.post('/api/articles/:name/upvote', async (req,res) =>{
    const {name} = req.params;
    const{uid} = req.user;

    const article = await db.collection('articles').findOne({ name });

    const upvoteIds = article.upvoteIds || [];
    const canUpvote = uid && !upvoteIds.includes(uid);

    if(canUpvote){
        const updatedArticle = await db.collection('articles').findOneAndUpdate({name},{
    $inc: {upvotes:1},
    $push: {upvoteIds : uid},
   },{
    returnDocument: 'after'
   })

   res.json(updatedArticle)

    }else{
        res.sendStatus(403);
    }   
})

app.post('/api/articles/:name/comments', async(req,res) =>{
    const {name} = req.params;
    const {postedBy, text} = req.body;
    const newComment = {postedBy, text}

    const updatedArticle = await db.collection('articles').findOneAndUpdate({name},{
        $push: {comments: newComment}
    },{
        returnDocument: 'after'
    })

    res.json(updatedArticle.value || updatedArticle)
})

const port = process.env.PORT || 3000; 
async function start(){
    await connectToDb();
    app.listen(port, () =>{
    console.log("Server is running on port " + port);
    
})
}

start();




// const articleInfo = [
//     {name : "learn-node", upvotes : 0, comments : []},
//     {name : "learn-react",upvotes : 0, comments : []},
//     {name : "mongodb", upvotes : 0, comments : []},
// ] 


// app.get('/', (req, res) => {
//   res.send('Hello World!');
// })

// app.get('/hello/:name', (req, res) => {
//     const name = req.params.name;
//     res.send(`Hello ${name}`);
// })

// app.post('/', (req, res) => {
//     console.log("Post request received"+req.body.name);
// });