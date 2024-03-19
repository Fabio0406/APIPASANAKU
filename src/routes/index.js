import { Router } from "express";
import { createCliente, createCuentas, deletecuenta, getCuentas, logincliente, updatecuentas, updateusser } from "../controllers/Usuario.CO.js";

const router = Router()

router.post('/api/register', createCliente)

router.post('/api/registerC/:usser', createCuentas)

router.get('/api/cuentas/:usser', getCuentas)

router.put('/api/cuentas/:usser', updatecuentas)

router.delete('/api/cuentas/:usser/:id', deletecuenta)

router.put('/api/edit/:usser',updateusser)

router.post('/api/login', logincliente)

export default router