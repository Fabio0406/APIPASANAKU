import { Router } from "express";
import { UpdateToken, cambiarestado, createCliente, createCuentas, createPartidas, deletecuenta, getCliente, getCuentas, getInvitados, getNotificaciones, getPartidas, invitar, logincliente, updatecuentas, updateusser } from "../controllers/Usuario.CO.js";

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



export default router