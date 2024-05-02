import { consul } from "../db.js"// BASE DE DATOS
import admin from "../index.js"// MANDAR NOTIFICACIONES
import { transporter } from "./correo.js"
//-----------REALIZAR TAREAS CON TIEMPO-------
import { scheduleJob } from "node-schedule"
//--------------------------------------------
//----------PARA PODER SUBIR QR--------
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { unlink } from 'fs/promises';
//---------------------------
/* import client from "./whatsapp.js"
import QRcode from "qrcode" */

var partidas = {}

export const getCliente = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM usuario where usser = $1', [req.params.usser])
        res.status(200).json(resp.rows[0])
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
        /* const invitado = await consul.query('SELECT token FROM usuario WHERE correo = $1 AND telefono = $2', [correo, telefono])
        if (invitado.rowCount > 0) {
            var message = {
                notification: {
                    title: 'Has sido Invitado a una partida',
                    body: 'se te invito a la partida: ' + datos.rows[0].titulo_partida
                },
                token: invitado.rows[0].token // token del usuario específico
            };
            Sendnotifi(message)
        } */
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
        const resp = await consul.query('Select * from notificacion where id_usuario = $1;', [req.params.usser])
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
        const { Nombre, Participantes, TiempoPago, otroInput, MontoTotal, moneda, otroInputMoneda, fechainicio, multa, tiempooferta } = req.body;
        let tiempoPagoUsar = TiempoPago;
        let monedaUsar = moneda;

        if (TiempoPago === 'otro' && otroInput) {
            tiempoPagoUsar = otroInput;
        }

        if (moneda === 'otro' && otroInputMoneda) {
            monedaUsar = otroInputMoneda;
        }
        const fechaorigen = new Date();
        const resp = await consul.query('INSERT INTO partida (titulo, montotal, tiempopago, tipomoneda, participantes,multa,tiempooferta,fechaorigen,fechainicio) VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9)', [Nombre, MontoTotal, tiempoPagoUsar, monedaUsar, Participantes, multa, tiempooferta, fechaorigen, fechainicio]);
        console.log(resp.command + " de partida")
        const partida = await consul.query('SELECT * FROM partida ORDER BY id DESC LIMIT 1');
        console.log(partida.command + " de partidaid")
        programarInicioPartida(partida.rows[0])
        const ressp = await consul.query('INSERT INTO participante (id_user, id_partida, id_rol) VALUES ($1, $2, $3)', [req.params.usser, partida.rows[0].id, 1]);
        console.log(ressp.command + " de participante")
        res.status(200).json(partida.rows[0].id);
    } catch (error) {
        res.send(error);
    }
};

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

export const iniciar = async (req, res) => {
    try {
        const id_partida = req.params
        const part = await consul.query('select * from partida where id = $1', [id_partida])
        const partida = part.rows[0]
        programarInicioPartida(partida)
        res.send("Comenzo conteo de")
    } catch (error) {

    }
}

export const SaveOferta = async (req, res) => {
    try {
        const { id_partida, usser, turno, monto } = req.params
        const Ver = await consul.query('SELECT EXISTS (SELECT 1 FROM public.oferta WHERE id_partida = $1 AND id_user = $2 AND turno = $3) AS existe_oferta;', [id_partida, usser, turno])

        if (Ver.rows[0].existe_oferta) {
            res.status(409).json("Usuario ya Oferto")
        } else {
            const resp = await consul.query('INSERT INTO public.oferta (id_partida, id_user, turno, oferta) VALUES ($1, $2, $3, $4);', [id_partida, usser, turno, monto])
            res.send(resp.command + " exitoso")
        }
    } catch (error) {
        res.send(error)
    }
}
//-----------------------------------------------------------------
//-------------------------Subir QR--------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));


export const UpdateQr = async (req, res) => {
    try {
        const usuario = req.params.usser
        const qr = await consul.query('SELECT qr IS NOT NULL AS tiene_qr, COALESCE(qr, \'\') AS valor_qr FROM public.usuario WHERE usser = $1;', [usuario])
        if (qr.rows.length === 0) {
            // Si no se encuentra ningún usuario con ese 'usser', devolvemos un 404
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (qr.rows[0].tiene_qr) {
            // borrar imagen anterior
            const qrAntiguo = join(__dirname, `../public/img/${qr.rows[0].valor_qr}`);
            if (fs.existsSync(qrAntiguo)) {
                await unlink(qrAntiguo)
            }
        }
        const resp = await consul.query('UPDATE public.usuario SET qr = $1 WHERE usser = $2;', [req.file.filename, usuario])
        res.send("Se ha subido correctamente")
    } catch (error) {
        res.send(error)
    }
}
//---------------------------EnviarQr--------------------------------

export const getQr = async (req, res) => {
    try {
        // Suponiendo que `consul` es un objeto para realizar consultas a una base de datos
        const resp = await consul.query('SELECT * FROM usuario where usser = $1', [req.params.usser]);
        if (resp.rows.length === 0) {
            // Si no se encuentra ningún usuario con ese 'usser', devolvemos un 404
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Obtener la ruta completa de la imagen
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const imagePath = join(__dirname, `../public/img/${resp.rows[0].qr}`);
        // Verificar si la imagen existe en el sistema de archivos
        if (fs.existsSync(imagePath)) {
            // Si existe, enviar el archivo como respuesta
            return res.sendFile(imagePath);
        } else {
            // Si la imagen no existe, enviar una imagen predeterminada
            const defaultImagePath = join(__dirname, '../public/img/default.png');
            return res.sendFile(defaultImagePath);
        }
    } catch (error) {
        // Si hay un error durante la ejecución, devolver un 500
        console.error('Error en la función getQr:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
export const getQrG = async (req, res) => {
    try {
        // Suponiendo que `consul` es un objeto para realizar consultas a una base de datos
        const resp = await consul.query('SELECT u.qr FROM public.usuario u JOIN public.oferta o ON u.usser = o.id_user JOIN public.participante p ON p.id_user = u.usser WHERE o.id_partida = $1 AND o.turno = $2 AND o.ganador = TRUE;', [req.params.id_partida, req.params.usser]);
        if (resp.rows.length === 0) {
            // Si no se encuentra ningún usuario con ese 'usser', devolvemos un 404
            return res.status(404).json({ error: 'No hay ganador de ese turno' });
        }
        // Obtener la ruta completa de la imagen
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const imagePath = join(__dirname, `../public/img/${resp.rows[0].qr}`);
        // Verificar si la imagen existe en el sistema de archivos
        if (fs.existsSync(imagePath)) {
            // Si existe, enviar el archivo como respuesta
            return res.sendFile(imagePath);
        } else {
            // Si la imagen no existe, enviar una imagen predeterminada
            const defaultImagePath = join(__dirname, '../public/img/default.png');
            return res.sendFile(defaultImagePath);
        }
    } catch (error) {
        // Si hay un error durante la ejecución, devolver un 500
        console.error('Error en la función getQr:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
//-------------------------------------------------------------------
export const cambiarestado = async (req, res) => {
    try {
        const { usser, estado, id_partida, id_invitacion } = req.params
        const resp = await consul.query('UPDATE invitado SET id_estado = $1 WHERE id = $2;', [estado, id_invitacion])
        if (estado == 3) {
            const insertP = await consul.query('INSERT INTO participante (id_user, id_partida, id_rol) VALUES ($1,$2,$3)', [usser, id_partida, 2])
            console.log(insertP.command + " participante añadido")
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

// 'partida' es un objeto que contiene la información de la partida
// 'partida.inicio' es la fecha de inicio de la partida, que debe ser un objeto de tipo Date
// Crea un temporizador para el INICIO esta partida
function programarInicioPartida(partida) {
    const tiempoDate = calcularInMin(partida.fechainicio)

    console.log("---------------la partida iniciara : " + tiempoDate + "-------------------------"); // Imprime la fecha de inicio de la partida
    let intervalo = setInterval(function () {
        let minutosRestantes = tiempoRestanteS(tiempoDate);
        console.log(`Quedan ${minutosRestantes} Segundos para que comience la partida`);
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    let tarea = scheduleJob(tiempoDate, async function () {
        console.log("-------------------------Comenzo las ofertas!---------------------------")
        TempoOferta(partida)
    });
    partidas[partida.id] = tarea;
}

function numeroAleatorio(min, max) {// para elegir un usuario aleatorio si es necesario
    // Generar un número aleatorio entre min (incluido) y max (incluido)
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function TempoOferta(partida) {// esto es el temporizador de finalizo la oferta y comienza el tiempo de pago
    console.log("-------------------El temporizador de oferta comenzo---------------------------")
    const tiempoDate = calcularInMin(partida.tiempooferta)
    let intervalo = setInterval(function () {
        let minutosRestantes = tiempoRestanteS(tiempoDate);
        console.log(`Quedan ${minutosRestantes} Segundos para que termine la oferta`);
        // Si la partida ya comenzó, detén el intervalo
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    let tarea = scheduleJob(tiempoDate, async function () {
        console.log("--------------------------Concluyo el tiempo de oferta---------------------")
        const Ganador = await GanadorM(partida.id)
        if (Ganador) {
            console.log("el ganador es :")
            console.log(Ganador)
            const cuota = Math.round(Ganador.valor_oferta - partida.montotal);
            const participantes = await consul.query('SELECT * FROM public.participante WHERE id_partida = $1 AND id_user != $2;', [partida.id, Ganador.usser])
            await consul.query('INSERT INTO public.pago (id_partida, id_user, turno, monto_pagar, pagado) VALUES ($1, $2, $3, $4, TRUE);', [partida.id, Ganador.usser, partida.turno_actual, Ganador.valor_oferta])
            console.log("la cantidad de participantes son = " + participantes.rowCount + " y son:")
            console.log(participantes.rows)
            for (let index = 0; index <= participantes.rowCount - 1; index++) {
                await consul.query('INSERT INTO public.pago (id_partida, id_user, turno, monto_pagar, pagado) VALUES ($1, $2, $3, $4, FALSE);', [partida.id, participantes.rows[index].id_user, partida.turno_actual, cuota])
            }
        } else {
            const Ganador = await GanadorA(partida.id)
            console.log("el ganador Aleatorio es :")
            console.log(Ganador)
            const participantes = await consul.query('SELECT * FROM public.participante WHERE id_partida = $1 AND id_user != $2;', [partida.id, Ganador.usser])
            await consul.query('INSERT INTO public.pago (id_partida, id_user, turno, monto_pagar, pagado) VALUES ($1, $2, $3, $4, TRUE);', [partida.id, Ganador.usser, partida.turno_actual, partida.montotal])
            console.log("la cantidad de participantes son = " + participantes.rowCount + " y son:")
            console.log(participantes.rows)
            for (let index = 0; index <= participantes.rowCount - 1; index++) {
                await consul.query('INSERT INTO public.pago (id_partida, id_user, turno, monto_pagar, pagado) VALUES ($1, $2, $3, $4, FALSE);', [partida.id, participantes.rows[index].id_user, partida.turno_actual, partida.montotal])
            }
        }
        //notificar al ganador
        //notificar a los participantes

        if (partida.turno_actual == partida.participantes) {
            Tempofinalizar(partida)
        } else {
            TempoSigOferta(partida)
        }
        //
    });
    partidas[partida.id] = tarea;
}
async function GanadorM(id_partida) {
    const VerGanador = await consul.query('SELECT u.*, (SELECT oferta FROM public.oferta WHERE id_partida = $1 AND turno = (SELECT turno_actual FROM public.partida WHERE id = $1) ORDER BY oferta DESC LIMIT 1) AS valor_oferta FROM public.usuario u WHERE usser = (SELECT id_user FROM public.oferta WHERE id_partida = $1 AND turno = (SELECT turno_actual FROM public.partida WHERE id = $1) ORDER BY oferta DESC LIMIT 1);', [id_partida])
    return VerGanador.rows[0]
}
async function GanadorA(id_partida) {
    const ganadorA = await consul.query('SELECT u.* FROM public.usuario u INNER JOIN public.participante p ON u.usser = p.id_user LEFT JOIN (SELECT DISTINCT id_user FROM public.oferta WHERE id_partida = $1 AND ganador = TRUE) AS ganadores ON u.usser = ganadores.id_user WHERE p.id_partida = $1 AND ganadores.id_user IS NULL;', [id_partida])
    const numero = numeroAleatorio(0, ganadorA.rowCount - 1);
    return ganadorA.rows[numero]
}

function TempoSigOferta(partida) {// esto es el tiempo de pago finalizado y comienzo de la siguiente oferta o si en caso haya multa son 3 dias mas(1 min)
    const tiempoDate = calcularInMin(partida.tiempopago)
    console.log("---------------------------------comenzo el temporizador de tiempo de pago---------------------------")
    let intervalo = setInterval(function () {
        let minutosRestantes = tiempoRestanteS(tiempoDate);
        console.log(`Quedan ${minutosRestantes} Segundos para que concluya el tiempo para pagar`);
        // Si la partida ya comenzó, detén el intervalo
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    let tarea = scheduleJob(tiempoDate, async function () {
        console.log("--------------------------------el tiempo pago concluyo-------------------------------------")
        //traer todos los usuarios que no han pagado
        const usuarios = await consul.query('SELECT u.* FROM public.usuario u WHERE u.usser IN (SELECT p.id_user FROM public.pago p WHERE p.id_partida = $1 AND p.turno = (SELECT turno_actual FROM public.partida WHERE id = $1) AND p.pagado = FALSE);', [partida.id])
        console.log("Los usuarios que deben son: ")
        console.log(usuarios.rows)
        if (usuarios.rowCount > 0) {// si hay usuarios que no han pagado entonces se empiesa a multar pos 3 dias(1 min)
            const tiempo = calcularInMin(1)
            await tiempoesperaM(partida, tiempo)
        } else {
            //actuaizo el turno
            const parti = await consul.query('SELECT COUNT(*) AS cantidad_usuarios FROM public.participante WHERE id_partida = $1;',[partida.id])
            if (partida.turno_actual != parti.rows[0].cantidad_usuarios) {
                const pasarT = await consul.query('UPDATE public.partida SET turno_actual = turno_actual + 1 WHERE id = $1;',[partida.id])
                console.log("turno sig = " + pasarT.command)
                const partN = await consul.query('Select * from partida where id = $1', [partida.id])
                partida = await partN.rows[0]
                TempoOferta(partida)
            }else{
                console.log("-------------La partida ha concluido-----------------")
            }
        }
    });
    partidas[partida.id] = tarea;
}

function Tempofinalizar(partida) {// esto es el ultimo tiempo de pago finalizado
    const tiempoDate = calcularInMin(partida.tiempopago)
    console.log("-------------------Comienza el temporizador Ultima paga-----------------------")
    let intervalo = setInterval(function () {
        let minutosRestantes = tiempoRestanteS(tiempoDate);
        console.log(`Quedan ${minutosRestantes} Segundos para que concluya el ultimo tiempo pago`);
        // Si la partida ya comenzó, detén el intervalo
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    let tarea = scheduleJob(tiempoDate, async function () {
        console.log("--------------------concluyo el temporizador Ultima paga--------------------")
        const usuarios = await consul.query('SELECT u.* FROM public.usuario u WHERE u.usser IN (SELECT p.id_user FROM public.pago p WHERE p.id_partida = $1 AND p.turno = (SELECT turno_actual FROM public.partida WHERE id = $1) AND p.pagado = FALSE);', [partida.id])
        console.log("(Ultima vuelta)Los usuarios que deben son: ")
        console.log(usuarios.rows)
        if (usuarios.rowCount > 0) {// si hay usuarios que no han pagado entonces se empiesa a multar pos 3 dias(1 min)
            const tiempo = calcularInMin(1)
            await tiempoesperaM(partida, tiempo)
        }
    });
    partidas[partida.id] = tarea;
}

async function tiempoesperaM(partida, tiempo) {// este es el tiempo de espera para la multa
    console.log("-------------------------------comienza temporizador de Multas----------------------------------")
    let intervalo = setInterval(function () {
        let minutosRestantes = tiempoRestanteS(tiempo);
        console.log(`Quedan ${minutosRestantes} Segundos incremente multa`);
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    const usuarios = await consul.query('SELECT u.* FROM public.usuario u WHERE u.usser IN (SELECT p.id_user FROM public.pago p WHERE p.id_partida = $1 AND p.turno = (SELECT turno_actual FROM public.partida WHERE id = $1) AND p.pagado = FALSE AND p.veces_multado < 3);', [partida.id])
    console.log("(Dentro de la funcion )Los usuarios que deben son: ")
    console.log(usuarios.rows)
    for (let index = 0; index <= usuarios.rowCount - 1; index++) {
        const pagoIN = await consul.query('UPDATE public.pago SET monto_pagar = monto_pagar + $1 WHERE id_partida = $2 AND id_user = $3 AND turno = $4;', [partida.multa, partida.id, usuarios.rows[index].usser, partida.turno_actual])
        const pagoVInc = await consul.query('UPDATE public.pago SET veces_multado = veces_multado + 1 WHERE id_partida = $1 AND id_user = $2 AND turno = $3', [partida.id, usuarios.rows[index].usser, partida.turno_actual])
        console.log(pagoIN.command + " inc cuota")
        console.log(pagoVInc.command + " Veces de multa")
    }
    let tarea = scheduleJob(tiempo, async function () {
        console.log("------------------------------concluyo el temporizador de Multas-----------------------------")
        const NewUsuarios = await consul.query('SELECT u.* FROM public.usuario u WHERE u.usser IN (SELECT p.id_user FROM public.pago p WHERE p.id_partida = $1 AND p.turno = (SELECT turno_actual FROM public.partida WHERE id = $1) AND p.pagado = FALSE AND p.veces_multado < 3);', [partida.id])
        console.log("(Dentro de la funcion )Los nuevos usuarios que deben son: ")
        console.log(NewUsuarios.rows)
        if (NewUsuarios.rowCount != 0) {
            const tiempo = calcularInMin(1)
            tiempoesperaM(partida, tiempo)
        } else {
            const parti = await consul.query('SELECT COUNT(*) AS cantidad_usuarios FROM public.participante WHERE id_partida = $1;',[partida.id])
            if (partida.turno_actual != parti.rows[0].cantidad_usuarios) {
                const pasarT = await consul.query('UPDATE public.partida SET turno_actual = turno_actual + 1 WHERE id = $1;',[partida.id])
                console.log("turno sig = " + pasarT.command)
                const partN = await consul.query('Select * from partida where id = $1', [partida.id])
                partida = await partN.rows[0]
                TempoOferta(partida)
            }else{
                console.log("-------------La partida ha concluido-----------------")
            }
        }
    });
    partidas[partida.id] = tarea;
}

function Sendnotificaciones(notificacion) {
    admin.messaging().sendMulticast(notificacion)
        .then((response) => {
            console.log('Notificación enviada correctamente:', response);
        })
        .catch((error) => {
            console.log('Error al enviar la notificación:', error);
        });
}
function Sendnotifi(notificacion) {
    admin.messaging().send(message)
        .then((response) => {
            console.log('Notificación enviada correctamente:', response);
        })
        .catch((error) => {
            console.log('Error al enviar la notificación:', error);
        });
}
function calcularInMin(minutos) {
    let ahora = new Date();
    let minutosDespues = new Date(ahora.getTime() + minutos * 60000);
    console.log(minutosDespues);
    return minutosDespues
}
function tiempoRestanteS(partida) {
    // Obtiene la fecha actual
    let ahora = new Date();
    // Calcula la diferencia en milisegundos
    let diferencia = partida.getTime() - ahora.getTime();
    // Convierte la diferencia a minutos
    let minutos = Math.floor(diferencia / 1000);
    return minutos;
}