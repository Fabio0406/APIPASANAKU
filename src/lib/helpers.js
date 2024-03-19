import bcrypt from "bcryptjs";
const helpers = {};

// Funcion que devuele contraseña encriptada------------------------------
helpers.encriptar = async (contra) => {
    const hash = await bcrypt.hash(contra, 10)
    
    return hash
}
//-----------------------------------------------------------------------

// Funcion que compara y devuelve un boolean si la contraseña es correcta
helpers.descriptar = async (contra, Savecontra) => {
    try {                
        const Result = await bcrypt.compare(contra, Savecontra);
        return Result
    } catch (e) {
        console.log(e)
    }
}

helpers.VRolM = (rol) => {
             
        if(rol == 2){
            return true
        }
        return false

}
helpers.VRolAs = (rol) => {
             
        if(rol == 3){
            return true
        }
        return false

}

helpers.VRolAd = (rol) => {
               
        if(rol == 1){
            return true
        }
        return false

}
//-----------------------------------------------------------------------

export default helpers;
