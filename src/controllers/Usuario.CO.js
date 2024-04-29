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
        console.log(estado)
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
        console.log(`Quedan ${minutosRestantes} Segundos para que comience la partida.`);
        // Si la partida ya comenzó, detén el intervalo
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    let tarea = scheduleJob(tiempoDate, async function () {
        console.log("-------------------------Comenzo las ofertas!---------------------------")
        await consul.query('UPDATE public.partida SET id_estado = 4 WHERE id = $1;', [partida.id])
        const usuarios = await consul.query('SELECT u.* FROM public.participante p JOIN public.usuario u ON p.id_user = u.usser WHERE p.id_partida = $1', [partida.id])
        var tokens = usuarios.rows.map(user => user.token);
        /* var message = {
            notification: {
                title: 'La partida ' + partida.titulo + ' ha comenzado',
                body: 'Ya puede hacer tu oferta para el turno ' + partida.turno_actual + '!!'
            },
            tokens: tokens
        }; 
        Sendnotificaciones(message)*/
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
        console.log(`Quedan ${minutosRestantes} Segundos .`);
        // Si la partida ya comenzó, detén el intervalo
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    let tarea = scheduleJob(tiempoDate, async function () {
        console.log("--------------------------Concluyo el tiempo de oferta---------------------")
        //obtener todos los participantes de una partida
        const usuarios = await consul.query('SELECT u.* FROM public.participante p JOIN public.usuario u ON p.id_user = u.usser WHERE p.id_partida = $1', [partida.id])
        var tokens = usuarios.rows.map(user => user.token);
        /* var message = {
            notification: {
                title: 'partida ' + partida.titulo,
                body: 'Concluyo el tiempo de oferta'
            },
            tokens: tokens
        };
        Sendnotificaciones(message) */// manda notificacion a todos los participantes avisando que termino la oferta
        // verifico si hubo alguna oferta si no hubo tiene que ser aleatorio la eleccion del ganador y que no haya ganado antes
        const ganador = await consul.query('SELECT u.usser AS id_user, u.token, u.nombre, MAX(o.oferta) AS mayor_oferta FROM public.oferta o JOIN public.usuario u ON o.id_user = u.usser WHERE o.id_partida = $1 GROUP BY u.usser, u.token, u.nombre;', [partida.id])
        let userG = ""
        if (ganador.rowCount != 0) {// si hay ganador
            userG = ganador.rows[0].token
            const cuota = Math.round(ganador.rows[0].mayor_oferta - partida.montotal);
            const participants = await consul.query('SELECT * FROM public.participante WHERE id_partida = $1 AND id_user != $2;', [partida.id, ganador.rows[0].id_user])
            await consul.query('INSERT INTO public.pago (id_partida, id_user, turno, monto_pagar, pagado) VALUES ($1, $2, $3, $4, TRUE);', [partida.id, ganador.rows[0].id_user, partida.turno_actual, ganador.rows[0].mayor_oferta])
            for (let index = 0; index < participants.rowCount; index++) {
                await consul.query('INSERT INTO public.pago (id_partida, id_user, turno, monto_pagar, pagado) VALUES ($1, $2, $3, $4, FALSE);', [partida.id, participants.rows[index].id_user, partida.turno_actual, cuota])
            }
        } else {//no hay ganador asigna aleatorio
            const ganadorA = await consul.query('SELECT u.* FROM public.usuario u INNER JOIN public.participante p ON u.usser = p.id_user LEFT JOIN (SELECT DISTINCT id_user FROM public.oferta WHERE id_partida = $1 AND ganador = TRUE) AS ganadores ON u.usser = ganadores.id_user WHERE p.id_partida = $1 AND ganadores.id_user IS NULL;', [partida.id])
            const numero = numeroAleatorio(0, ganadorA.rowCount - 1);
            console.log("el numero aleatorio es =" + numero)
            userG = ganadorA.rows[numero]
            console.log("userG tiene = ")
            console.log(userG)
            const participants = await consul.query('SELECT * FROM public.participante WHERE id_partida = $1 AND id_user != $2;', [partida.id, userG.usser])
            console.log("los participantes son = ")
            console.log(participants.rows)
            const v = await consul.query('INSERT INTO public.pago (id_partida, id_user, turno, monto_pagar, pagado) VALUES ($1, $2, $3, $4, TRUE);', [partida.id, userG.usser, partida.turno_actual, partida.montotal])
            console.log("pago del ganador = ", v.command)
            for (let index = 0; index < participants.rowCount; index++) {
                const p = await consul.query('INSERT INTO public.pago (id_partida, id_user, turno, monto_pagar, pagado) VALUES ($1, $2, $3, $4, FALSE);', [partida.id, participants.rows[index].id_user, partida.turno_actual, partida.montotal])
                console.log("pago del participante = ", p.command)
            }
        }
        // aqui tendria que verificar el ganador        
        /*  message = {
             notification: {
                 title: 'partida ' + partida.titulo,
                 body: 'has Ganado la oferta!'
             },
             token: userG.token
         };
         Sendnotifi(message) */

        // manda notificacion al ganador
        // verificar si el ganador tiene qr
        const ganadorQR = await consul.query('SELECT CASE WHEN qr IS NOT NULL THEN TRUE ELSE FALSE END AS tiene_qr FROM public.usuario WHERE usser = $1;', [userG.usser])
        // si tiene qr notificar a los demas que pueden hacer su pago 
        if (ganadorQR.rows[0].tiene_qr) {
            /* var message = {
                notification: {
                    title: 'partida ' + partida.titulo,
                    body: 'El ganador subio su Qr ya puedes pagar'
                },
                tokens: tokens
            };
            Sendnotificaciones(message) */
            // notificacion a todos para que hagan su pago ya hay qr
        } else {// si no tiene, notificar al ganador que debe subir un qr
            /*  message = {
                 notification: {
                     title: 'partida ' + partida.titulo,
                     body: 'Sube tu QR para que te puedan abonar'
                 },
                 token: userG.token
             };
             Sendnotifi(message) */
            // notificar que suba qr
        }
        // aqui deberia haber una verificacion para saber si es la ultima oferta o no
        const resul = await consul.query('SELECT (SELECT COUNT(*) FROM public.participante WHERE id_partida = $1) - COUNT(DISTINCT o.turno) AS turnos_faltantes FROM public.oferta o WHERE o.id_partida = $1;', [partida.id])
        const cantidad = resul.rows[0].turnos_faltantes
        if (cantidad != 0) {
            TempoSigOferta(partida)
        } else {
            Tempofinalizar(partida, true)
        }
        //
    });
    partidas[partida.id] = tarea;
}

function TempoSigOferta(partida) {// esto es el tiempo de pago finalizado y comienzo de la siguiente oferta o si en caso haya multa son 3 dias mas(1 min)
    const tiempoDate = calcularInMin(partida.tiempopago)
    console.log("---------------------------------comenzo el temporizador de tiempo de pago---------------------------")
    let intervalo = setInterval(function () {
        let minutosRestantes = tiempoRestanteS(tiempoDate);
        console.log(`Quedan ${minutosRestantes} Segundos.`);
        // Si la partida ya comenzó, detén el intervalo
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    let tarea = scheduleJob(tiempoDate, async function () {
        console.log("--------------------------------el tiempo pago concluyo-------------------------------------")
        const usuarios = await consul.query('SELECT u.* FROM public.usuario u WHERE u.usser IN (SELECT p.id_user FROM public.pago p WHERE p.id_partida = $1 AND p.turno = (SELECT turno_actual FROM public.partida WHERE id = $1) AND p.pagado = FALSE);', [partida.id])
        if (usuarios.rowCount > 0) {// si hay usuarios que no han pagado entonces se empiesa a multar pos 3 dias(1 min)
            const tiempo = calcularInMin(1)
            tiempoesperaM(partida, tiempo, false)
        } else {
            //actuaizo el turno
            const pasrT = await consul.query('UPDATE public.partida SET turno_actual = turno_actual + 1 WHERE id = $1;'[partida.id])
            console.log("turno sig = " + pasrT.command)
            const partN = await consul.query('Select * from partida where id = $1', [partida.id])
            partida = await partN.rows[0]
        }
        TempoOferta(partida)
    });
    partidas[partida.id] = tarea;
}

function Tempofinalizar(partida, Ult) {// esto es el ultimo tiempo de pago finalizado
    const tiempoDate = calcularInMin(partida.tiempopago)
    console.log("-----------comienza el temporizador Ultima paga-----------------------")
    let intervalo = setInterval(function () {
        let minutosRestantes = tiempoRestanteS(tiempoDate);
        console.log(`Quedan ${minutosRestantes} Segundos para que comience la partida.`);
        // Si la partida ya comenzó, detén el intervalo
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    let tarea = scheduleJob(tiempoDate, async function () {
        console.log("--------------------concluyo el temporizador Ultima paga--------------------")
        const usuarios = await consul.query('SELECT u.* FROM public.usuario u WHERE u.usser IN (SELECT p.id_user FROM public.pago p WHERE p.id_partida = $1 AND p.turno = (SELECT turno_actual FROM public.partida WHERE id = $1) AND p.pagado = FALSE);', [partida.id])
        if (usuarios.rowCount > 0) {// si hay participantes sin pagar
            tiempoesperaM(partida, tiempo, Ult)
        }
        await consul.query('UPDATE public.partida SET id_estado = 6 WHERE id = $1;', [partida.id])
    });
    partidas[partida.id] = tarea;
}

async function tiempoesperaM(partida, tiempo, Ult) {// este es el tiempo de espera para la multa
    console.log("-------------------------------comienza temporizador de Multas----------------------------------")
    let intervalo = setInterval(function () {
        let minutosRestantes = tiempoRestanteS(tiempo);
        console.log(`Quedan ${minutosRestantes} Segundos incremente multa`);
        // Si la partida ya comenzó, detén el intervalo
        if (minutosRestantes <= 0) {
            clearInterval(intervalo);
        }
    }, 1000);
    const usuarios = await consul.query('SELECT u.* FROM public.usuario u WHERE u.usser IN (SELECT p.id_user FROM public.pago p WHERE p.id_partida = $1 AND p.turno = (SELECT turno_actual FROM public.partida WHERE id = $1) AND p.pagado = FALSE AND p.veces_multado < 3);', [partida.id])
    var tokens = usuarios.rows.map(user => user.token)
    let users = usuarios.rows.map(user => user.usser)
    /* var message = {
        notification: {
            title: 'La partida ' + partida.titulo,
            body: 'Se te ha multado paga para no seguir incrementando!!'
        },
        tokens: tokens
    };
    Sendnotificaciones(message) */
    users.forEach(async user => {
        const pagoIN = await consul.query('UPDATE public.pago SET monto_pagar = monto_pagar + $1 WHERE id_partida = $2 AND id_user = $3 AND turno = $4;', [partida.multa, partida.id, user.usser, partida.turno_actual])
        const pagoVInc = await consul.query('UPDATE public.pago SET veces_multado = veces_multado + 1 WHERE id_partida = $1 AND id_user = $2 AND turno = $3', [partida.id, user.usser, partida.turno_actual])
        console.log(pagoIN.command + " inc cuota")
        console.log(pagoVInc.command + " Veces de multa")
    });
    const us = await consul.query('select * from pago WHERE id_partida = $1 AND turno = $2 AND veces_multado != 3 AND pagado = false', [partida.id, partida.turno_actual])
    let tarea = scheduleJob(tiempo, async function () {
        console.log("------------------------------concluyo el temporizador de Multas-----------------------------")
        if (us.rowCount > 0) {// si sigue habiendo personas multadas 
            const tiempo = calcularInMin(1)
            tiempoesperaM(partida, tiempo, Ult)
        } else {// ya paso los tres dias
            if (!Ult) {
                await consul.query('UPDATE public.partida SET turno_actual = turno_actual + 1 WHERE id = $1;'[partida.id])
                const partN = await consul.query('Select * from partida where id = $1', [partida.id])
                partida = partN.rows[0]
                const participantes = consul.query('SELECT u.* FROM public.usuario u WHERE u.usser IN (SELECT p.id_user FROM public.participante p WHERE p.id_partida = $1 AND NOT EXISTS (SELECT 1 FROM public.oferta o WHERE o.id_partida = p.id_partida AND o.id_user = p.id_user AND o.ganador = TRUE));', [partida.id])
                var tokens = participantes.rows.map(user => user.token);
                /* var message = {
                    notification: {
                        title: 'La partida ' + partida.titulo + ' ha comenzado',
                        body: 'Ya puede hacer tu oferta para el turno ' + partida.turno_actual + '!!'
                    },
                    tokens: tokens
                };
                Sendnotificaciones(message) */
                TempoOferta(partida)
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

// funcion que calcula el date despues de minutos
function calcularInMinF(minutos) {
    let ahora = new Date();
    console.log("time de ahora: " + ahora.getTime())
    console.log("time de bd: " + minutos.getTime())
    let minutosDespues = new Date(ahora.getTime() + minutos.getTime() * 60000);
    console.log(minutosDespues);
    return minutosDespues
}

function calcularInMin(minutos) {
    let ahora = new Date();
    let minutosDespues = new Date(ahora.getTime() + minutos * 60000);
    console.log(minutosDespues);
    return minutosDespues
}
function calcularInMinLocal(minuto) {
    let ahora = new Date();
    let minutosDespues = new Date(ahora.getTime() + minuto * 60000);
    // Obtener las partes de la fecha y hora
    let año = minutosDespues.getFullYear();
    let mes = String(minutosDespues.getMonth() + 1).padStart(2, '0');
    let dia = String(minutosDespues.getDate()).padStart(2, '0');
    let horas = String(minutosDespues.getHours()).padStart(2, '0');
    let minutos = String(minutosDespues.getMinutes()).padStart(2, '0');
    let segundos = String(minutosDespues.getSeconds()).padStart(2, '0');
    let milisegundos = String(minutosDespues.getMilliseconds()).padStart(3, '0');

    // Formatear la fecha y hora
    let fechaHoraLocalFormatted = `${año}-${mes}-${dia}T${horas}:${minutos}:${segundos}.${milisegundos}Z`;
    console.log(fechaHoraLocalFormatted);
    return fechaHoraLocalFormatted;
}


function tiempoRestanteM(partida) {
    // Obtiene la fecha actual
    let ahora = new Date();
    // Calcula la diferencia en milisegundos
    let diferencia = partida.inicio.getTime() - ahora.getTime();
    // Convierte la diferencia a minutos
    let minutos = Math.floor(diferencia / 1000 / 60);
    return minutos;
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

function Tiemporestante(partida) {
    if (tiempoRestanteM(partida) >= 1) {
        let intervalo = setInterval(function () {
            let minutosRestantes = tiempoRestanteM(partida);
            console.log(`Quedan ${minutosRestantes} minutos para que comience la partida.`);
            // Si la partida ya comenzó, detén el intervalo
            if (minutosRestantes <= 0) {
                clearInterval(intervalo);
            }
        }, 60000); // 60000 milisegundos son 1 minuto
    }
    else {
        let intervalo = setInterval(function () {
            let minutosRestantes = tiempoRestanteS(partida);
            console.log(`Quedan ${minutosRestantes} segundos para que comience la partida.`);
            // Si la partida ya comenzó, detén el intervalo
            if (minutosRestantes <= 0) {
                clearInterval(intervalo);
            }
        }, 1000); // 60000 milisegundos son 1 minuto
    }
}