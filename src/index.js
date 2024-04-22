import express from 'express'
import morgan from 'morgan'
import { dirname,join } from "path"
import {fileURLToPath} from 'url'
import bodyParser from "body-parser"
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
app.use(cors())


app.set('port', process.env.PORT || 5000)


app.use(router)

app.listen(app.get('port'), () =>{
    console.log("servidor corriendo")
})


