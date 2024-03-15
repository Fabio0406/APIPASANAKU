import express from 'express'
import morgan from 'morgan'
import router from './rutas/index.js'
const app = express()


app.set('port', process.env.PORT || 5000)

app.use(morgan("dev"))
app.use(express.urlencoded({extended: false}))
app.use(express.json())


app.use(router)

app.listen(app.get('port'), () =>{
    console.log("servidor corriendo")
})


