import express from 'express'
import { dirname,join } from "path";
import {fileURLToPath} from 'url';
import bodyParser from "body-parser"
import morgan from "morgan"
import router from './routes/index.js'
import cors from 'cors'

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
    credentials: true, // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
app.use(cors(corsOptions))



app.set('port', process.env.PORT || 5000)


app.use(router)

app.listen(app.get('port'), () =>{
    console.log("servidor corriendo")
})


