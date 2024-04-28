import express from 'express'
import { dirname,join } from "path";
import {fileURLToPath} from 'url';
import bodyParser from "body-parser"
import morgan from "morgan"
import router from './routes/index.js'
import cors from 'cors'
import admin from 'firebase-admin'
import serviceAccount from './serviceAccountKey.json'assert { type: 'json' }

const app = express()

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
const __dirname = dirname(fileURLToPath(import.meta.url))
app.use(express.static(join(__dirname, 'public')))
var corsOptions = {
    origin: '*',
    credentials: true,
  }
app.use(cors(corsOptions))
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  // Intenta acceder a Firestore
  let db = admin.firestore();

  console.log('Firebase Admin SDK se inicializó correctamente');
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK:', error);
}

app.set('port', process.env.PORT || 5000)

app.use(router)

app.listen(app.get('port'), () =>{
    console.log("servidor corriendo")
})

export default admin


