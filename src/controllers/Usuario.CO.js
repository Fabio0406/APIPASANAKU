import { consul } from "../db.js"

export const getClientes = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM usuario')
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const createCliente = async (req, res) => {
    try {
        const { usser, nombre, contraseña, correo, telefono} = req.body
        const resp = await consul.query('INSERT INTO usuario (usser, nombre, contraseña, correo, telefono) VALUES ($1,$2,$3,$4,$5)', [usser, nombre, contraseña, correo, telefono])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const updateusser = async (req, res) => {
    try {
        const {nombre, contraseña, correo, telefono} = req.body
        const resp = await consul.query('UPDATE usuario SET nombre = $1, contraseña = $2, correo = $3, telefono = $4 WHERE usser = $5', [nombre, contraseña, correo, telefono, req.params.usser])
        res.send(resp.command)
    } catch (error) {
        res.send("ERROR")
    }
}

export const logincliente = async (req, res) => {
    try {
        const { usser, contraseña} = req.body
        console.log(req.body)
        const resp = await consul.query('SELECT * FROM usuario where usser = $1 and contraseña = $2', [usser, contraseña])
        console.log(resp.rows)
        if(resp.rowCount > 0){
            res.status(200).json(resp.rows)
        }else{
            res.status(404).json(resp.rows)
        }
    } catch (error) {
        res.send(error)
    }
}
//--------------------------------------------------------------------------------------------------------------
//------------------------------------------------Cuentas-------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
export const getCuentas = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM cuentab where usuario_id = $1',[req.params.usser])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const createCuentas = async (req, res) => {
    try {
        const {nombre, banco, tipom, nro, qr} = req.body
        console.log(req.body)
        const resp = null
        if (qr = ''){
            const resp = await consul.query('INSERT INTO cuentab (nombre, banco, tipom, nro, usuario_id) VALUES ($1,$2,$3,$4,$5)', [nombre, banco, tipom, nro, req.params.usser])
        }else{
            const resp = await consul.query('INSERT INTO cuentab (nombre, banco, tipom, nro, qr, usuario_id) VALUES ($1,$2,$3,$4,$5,$6)', [nombre, banco, tipom, nro, qr, req.params.usser])
        }
        console.log(resp)
        res.status(200).json(resp.command)
    } catch (error) {
        res.send("ERROR")
    }
}

export const updatecuentas = async (req, res) => {
    try {
        const {nombre, contraseña, correo, telefono} = req.body
        const resp = await consul.query('UPDATE usuario SET nombre = $1, contraseña = $2, correo = $3, telefono = $4 WHERE usser = $5', [nombre, contraseña, correo, telefono, req.params.usser])
        res.send(resp.command)
    } catch (error) {
        res.send("ERROR")
    }
}

export const deletecuenta = async (req, res) => {
    try {
        const resp = await consul.query('DELETE FROM cuentab WHERE id = $1', [req.params.id]);
        res.send(`Cuenta ${req.params.id} Eliminada`)
    } catch (error) {
        res.send("ERROR")
    }
}