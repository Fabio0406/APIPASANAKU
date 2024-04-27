import { consul } from "../db.js"
import { transporter } from "./correo.js"
/* import client from "./whatsapp.js"
import QRcode from "qrcode" */

export const getCliente = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM usuario where usser = $1', [req.params.usser])
        res.status(200).json(resp.rows[0])
    } catch (error) {
        res.send(error)
    }
}

export const post = async (req, res) => {
    try {   
        const resp = await consul.query('SELECT * FROM usuario ')    
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send(error)
    }
}


export const createCliente = async (req, res) => {
    try {
        const { usser, nombre, contrasena, correo, telefono } = req.body
        const resp = await consul.query('INSERT INTO usuario (usser, nombre, contrasena, correo, telefono) VALUES ($1,$2,$3,$4,$5)', [usser, nombre, contrasena, correo, telefono])
        res.status(200).json(resp.command)
    } catch (error) {
        res.send(error)
    }
}

export const updateusser = async (req, res) => {
    try {
        const { nombre, contrasena, correo, telefono } = req.body
        const resp = await consul.query('UPDATE usuario SET nombre = $1, contrasena = $2, correo = $3, telefono = $4 WHERE usser = $5', [nombre, contrasena, correo, telefono, req.params.usser])
        res.send(resp.command)
    } catch (error) {
        res.send(error)
    }
}

export const logincliente = async (req, res) => {
    try {
        const { usser, contrasena } = req.body
        const resp = await consul.query('SELECT * FROM usuario where usser = $1 and contrasena = $2', [usser, contrasena])
        if (resp.rowCount > 0) {
            res.status(200).json(resp.rows)
        } else {
            res.status(200).json(resp.rows)
        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
}

export const invitar = async (req, res) => {
    try {
        const id_estado = 1
        const id_partida = req.body.partidaid
        const { correo, telefono } = req.body
        const resp = await consul.query('INSERT INTO invitado (correo, telefono,id_partida,id_estado) VALUES ($1,$2,$3,$4)', [correo, telefono, id_partida, id_estado])
        const datos = await consul.query('SELECT p.titulo AS titulo_partida, u.nombre AS lider_partida, p.montotal AS montototal, p.tiempopago, p.participantes, p.tipomoneda FROM partida p INNER JOIN participante par ON p.id = par.id_partida INNER JOIN usuario u ON par.id_user = u.usser WHERE p.id = $1;', [id_partida])
        const pagos = datos.rows[0].montototal / datos.rows[0].participantes
        const mensaje = datos.rows[0].lider_partida + " te invitó a la partida: " + datos.rows[0].titulo_partida + "\nLos pagos de esta partida son de " + pagos + " " + datos.rows[0].tipomoneda + " cada " + datos.rows[0].tiempopago + "\nHaz clic aquí para unirte a la partida: [Link de invitación]\nSi aún no tienes la aplicación de Pasanaku,\npuedes escanear el código QR a continuación:"
        let mailOptions = {
            from: 'fabioarredondo44@gmail.com', // Tu dirección de correo electrónico
            to: correo, // Dirección de correo electrónico del destinatario
            subject: 'PASANAKU', // Asunto del correo
            html: '<p>' + mensaje + '</p><img src="cid:imagen1"/>', // Contenido HTML del correo con la imagen incrustada
            attachments: [{
                filename: 'imagen.png', // Nombre del archivo adjunto
                path: './src/public/image/qrcode.png', // Ruta de la imagen en tu sistema
                cid: 'imagen1' // ID de la imagen para ser utilizada en el contenido HTML
            }]
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Correo enviado: ' + info.response);
            }
        });
       
        /* const numeroDestinatario = '591' + telefono.toString(); // Reemplaza con el número del destinatario
        const chatId = numeroDestinatario + "@c.us";
        const message = "PASANAKU\n" + mensaje
        client.sendMessage(chatId, message); */
        
        res.status(200).json(resp.command)
    } catch (error) {
        res.send(error)
    }
}
//--------------------------------------------------------------------------------------------------------------
//------------------------------------------------Cuentas-------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
export const getCuentas = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM cuentab where usuario_id = $1', [req.params.usser])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send(error)
    }
}


export const getPartidas = async (req, res) => {
    try {
        const resp = await consul.query('SELECT partida.*, estado.nombre AS estado_nombre, COUNT(DISTINCT participante.id_user) AS cantidad_usuarios FROM partida INNER JOIN participante ON partida.id = participante.id_partida INNER JOIN estado ON partida.id_estado = estado.id WHERE partida.id IN (SELECT id_partida FROM participante WHERE id_user = $1 AND id_rol = $2) GROUP BY partida.id, estado.nombre;', [req.params.usser, 1])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send(error)
    }
}

export const getNotificaciones = async (req, res) => {
    try {
        const resp = await consul.query('SELECT invitado.id, invitado.correo, invitado.telefono, invitado.id_partida, estado.nombre AS estado FROM invitado JOIN estado ON invitado.id_estado = estado.id WHERE EXISTS (SELECT 1 FROM usuario WHERE usuario.correo = invitado.correo AND usuario.telefono = invitado.telefono AND usuario.usser = $1);', [req.params.usser])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send(error)
    }
}

export const getInvitados = async (req, res) => {
    try {
        const resp = await consul.query('SELECT invitado.id, invitado.correo, invitado.telefono, invitado.id_partida, COALESCE(u.usser, \'\') AS usser, estado.nombre AS estado FROM invitado JOIN estado ON invitado.id_estado = estado.id LEFT JOIN usuario u ON invitado.correo = u.correo AND invitado.telefono = u.telefono WHERE invitado.id_partida = $1;', [req.params.idpartida]);
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send(error)
    }
}

export const createCuentas = async (req, res) => {
    try {
        const { nombre, banco, tipom, nro, qr } = req.body
        console.log(req.body)
        const resp = null
        if (qr = '') {
            const resp = await consul.query('INSERT INTO cuentab (nombre, banco, tipom, nro, usuario_id) VALUES ($1,$2,$3,$4,$5)', [nombre, banco, tipom, nro, req.params.usser])
        } else {
            const resp = await consul.query('INSERT INTO cuentab (nombre, banco, tipom, nro, qr, usuario_id) VALUES ($1,$2,$3,$4,$5,$6)', [nombre, banco, tipom, nro, qr, req.params.usser])
        }
        console.log(resp)
        res.status(200).json(resp.command)
    } catch (error) {
        res.send(error)
    }
}

export const createPartidas = async (req, res) => {
    try {
        const { Nombre, Participantes, TiempoPago, otroInput, MontoTotal, moneda, otroInputMoneda } = req.body
        if (TiempoPago == 'otro' || moneda == 'otro') {
            const resp = await consul.query('INSERT INTO partida (titulo,montotal, tiempopago, tipomoneda, participantes) VALUES ($1,$2,$3,$4,$5)', [Nombre, MontoTotal, otroInput, otroInputMoneda, Participantes])
            const partida = await consul.query('SELECT id FROM partida ORDER BY id DESC LIMIT 1')
            const ressp = await consul.query('INSERT INTO participante (id_user, id_partida, id_rol) VALUES ($1,$2,$3)', [req.params.usser, partida.rows[0].id, 1])

            res.status(200).json(partida.rows[0].id)
        }
        if (TiempoPago == 'otro') {
            const resp = await consul.query('INSERT INTO partida (titulo,montotal, tiempopago, tipomoneda, participantes) VALUES ($1,$2,$3,$4,$5)', [Nombre, MontoTotal, otroInput, moneda, Participantes])
            const partida = await consul.query('SELECT id FROM partida ORDER BY id DESC LIMIT 1')
            const ressp = await consul.query('INSERT INTO participante (id_user, id_partida, id_rol) VALUES ($1,$2,$3)', [req.params.usser, partida.rows[0].id, 1])
            res.status(200).json(partida.rows[0].id)
        }
        if (moneda == 'otro') {
            const resp = await consul.query('INSERT INTO partida (titulo,montotal, tiempopago, tipomoneda, participantes) VALUES ($1,$2,$3,$4,$5)', [Nombre, MontoTotal, TiempoPago, otroInputMoneda, Participantes])
            const partida = await consul.query('SELECT id FROM partida ORDER BY id DESC LIMIT 1')
            const ressp = await consul.query('INSERT INTO participante (id_user, id_partida, id_rol) VALUES ($1,$2,$3)', [req.params.usser, partida.rows[0].id, 1])
            res.status(200).json(partida.rows[0].id)
        } else {
            const resp = await consul.query('INSERT INTO partida (titulo,montotal, tiempopago, tipomoneda, participantes) VALUES ($1,$2,$3,$4,$5)', [Nombre, MontoTotal, TiempoPago, moneda, Participantes])
            const partida = await consul.query('SELECT id FROM partida ORDER BY id DESC LIMIT 1')
            const ressp = await consul.query('INSERT INTO participante (id_user, id_partida, id_rol) VALUES ($1,$2,$3)', [req.params.usser, partida.rows[0].id, 1])
            res.status(200).json(partida.rows[0].id)
        }
    } catch (error) {
        res.send(error)
    }
}

export const updatecuentas = async (req, res) => {
    try {
        const { nombre, contraseña, correo, telefono } = req.body
        const resp = await consul.query('UPDATE usuario SET nombre = $1, contraseña = $2, correo = $3, telefono = $4 WHERE usser = $5', [nombre, contraseña, correo, telefono, req.params.usser])
        res.send(resp.command)
    } catch (error) {
        res.send(error)
    }
}

export const UpdateToken = async (req, res) => {
    try {
        const { token } = req.body
        const resp = await consul.query('UPDATE public.usuario SET token = $2 WHERE usser = $1;', [req.params.usser, token])
        res.send(resp.command)
    } catch (error) {
        res.send(error)
    }
}

export const cambiarestado = async (req, res) => {
    try {
        const { usser, estado, id_partida, id_invitacion } = req.params
        const resp = await consul.query('UPDATE invitado SET id_estado = $1 WHERE id = $2;', [estado, id_invitacion])
        console.log(estado)
        if (estado == 3) {
            const insertP = await consul.query('INSERT INTO participante (id_user, id_partida, id_rol) VALUES ($1,$2,$3)', [usser, id_partida, 2])
        }
        res.send(resp.command)
    } catch (error) {
        res.send(error)
    }
}

export const deletecuenta = async (req, res) => {
    try {
        const resp = await consul.query('DELETE FROM cuentab WHERE id = $1', [req.params.id]);
        res.send(`Cuenta ${req.params.id} Eliminada`)
    } catch (error) {
        res.send(error)
    }
}