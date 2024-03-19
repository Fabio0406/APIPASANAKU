import passport from 'passport';
import Strategy from 'passport-local';
import fetch from "node-fetch";
import helpers from './helpers.js';


//para iniciar sesion
passport.use('local.login', new Strategy.Strategy({
    usernameField: 'UsuI',
    passwordField: 'pass',
    passReqToCallback: true
}, async (req, UsuI, pass, done) => {
    try {
        console.log(UsuI)
        const response = await fetch(`https://apisi2.up.railway.app/api/usuar/${UsuI}`, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
        }).then((respueta) => {
            return respueta.json()
        })
        if (response.length > 0) {
            
            if (UsuI === response[0].usuario && await helpers.descriptar(pass, response[0].contrasena)) { // ¿existe algun Usuario?
                const culpable = response[0].ci
            await fetch(`https://apisi2.up.railway.app/api/I`, {
              method: 'post',
              mode: 'cors', // no-cors, *cors, same-origin
              cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
              credentials: 'same-origin', // include, *same-origin, omit
              body: JSON.stringify({ culpable }),
              headers: { 'Content-Type': 'application/json' },
              redirect: 'follow', // manual, *follow, error
              referrerPolicy: 'no-referrer',
            });
                return done(null, response[0])
            } else {
                if (response[0].intentos >= 3) {
                    return done(null, false, req.flash('denegado', 'usuario Bloqueado Comunicarse con Administracion'))
                }
                await fetch(`https://apisi2.up.railway.app/api/error`, {
                    method: 'post',
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    body: JSON.stringify({ UsuI }),
                    headers: { 'Content-Type': 'application/json' },
                    redirect: 'follow', // manual, *follow, error
                    referrerPolicy: 'no-referrer',
                });
                return done(null, false, req.flash('denegado', 'Contraseña Incorrecta'))
            }
        } else {
            return done(null, false, req.flash('denegado', 'Usuario No existe'))
        }
    } catch {

        return done(null, false, req.flash('denegado', 'Contraseña Incorrecta'))
    }
}))

passport.serializeUser((user, done) => {
    done(null, user.usuario);// mando los datos a las variables globales
});

passport.deserializeUser(async (user, done) => {
    try {
        const response = await fetch(`https://apisi2.up.railway.app/api/usuar/${user}`, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
        }).then((respueta) => {
            return respueta.json()
        })
        done(null, response[0]); // mando los datos a las variables globales
    } catch (e) {
        console.log(e)
    }
});