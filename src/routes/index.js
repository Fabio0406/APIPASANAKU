import { Router } from "express";
import { SaveOferta, UpdateQr, UpdateToken, cambiarestado, createCliente, createCuentas, createPartidas, deletecuenta, getCliente, getCuentas, getInvitados, getNotificaciones, getPartidas, getQr, getQrG, iniciar, invitar, logincliente, updatecuentas, updateusser } from "../controllers/Usuario.CO.js";
import multer from 'multer'
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
const router = Router()

router.post('/api/register', createCliente)

router.post('/api/registerC/:usser', createCuentas)

router.get('/api/user/:usser', getCliente)

router.post('/api/partida/:usser', createPartidas)

router.get('/api/cuentas/:usser', getCuentas)

router.get('/api/Partidas/:usser', getPartidas)

router.get('/api/invitados/:idpartida', getInvitados)

router.put('/api/cuentas/:usser/:id', updatecuentas)

router.delete('/api/cuentas/:usser/:id', deletecuenta)

router.put('/api/edit/:usser',updateusser)

router.post('/api/login', logincliente)

router.post('/api/invitar', invitar)

router.get('/api/notificacion/:usser',getNotificaciones)

router.post('/api/estadoinvitacion/:usser/:id_partida/:id_invitacion/:estado',cambiarestado)

router.post('/api/update/:usser',UpdateToken)//actualizar token

router.post('/api/oferta/:id_partida/:usser/:turno/:monto',SaveOferta)

router.post('/api/iniciar/:id_partida',iniciar)

//----------------------------------------------------
//--------------------Subir/Devolver QR---------------
const __dirname = dirname(fileURLToPath(import.meta.url));
export const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null, join(__dirname,'../public/img'))
    },
    filename: (req,file,cb) =>{
        const ext = file.originalname.split('.').pop()
        cb(null,`${Date.now()}.${ext}`)
    }
})
const upload = multer({storage})
router.post('/api/subirQr/:usser',upload.single('qr'),UpdateQr)//subir o actualizar qr
router.get('/api/getqr/:usser',getQr)// devuelve el qr de un usuario especifico
router.get('/api/getqr/:id_partida/:turno',getQrG)// devuelve el qr del ganador de la partida y turno especifico

//--------------------------------------------------------

export default router