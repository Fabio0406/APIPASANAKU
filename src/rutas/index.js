import { Router } from "express";

const router = Router()

router.get('/', (req,res) =>{
    res.json({"hello": "hola"})
})

export default router