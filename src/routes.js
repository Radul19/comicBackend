const { Router } = require("express")
const multer = require("multer")
const { home, login, register, addSerie, getProfile, deleteSerie, getSerie, addCap, updateProfile, editSerie, getCap, deleteCap, editCap, createComment, deleteComment, editComment, searchSerie } = require('./controller')

///// Configuracion Middleware Multer 
const itemStorageConfig = multer.diskStorage({
    // Ubicacion de las imagenes en Public/Uplaod
    destination: (req, file, cb) => {
        cb(null, "./public/uploads")
    },
    // El nombre de las imagenes sera imn-- + el numero en orden de la imagen 
    filename: (req, file, cb) => {
        cb(null, "img--" + file.originalname)
    }
})
// Se aplica la configuracion de multer
const uploadItem = multer({ storage: itemStorageConfig })

const router = Router()

// Aqui van todas las rutas
// router.get(Enlace para acceder , funcion a ejecutar)
router.get('/', home)

router.get('/login/:username/:password', login)

router.post('/register', register)

router.post('/addSerie', uploadItem.single("image"), addSerie)

router.get('/profile/:id', getProfile)

router.post('/updateProfile', uploadItem.single("image"), updateProfile)

router.get('/deleteSerie/:id', deleteSerie)

router.post('/editSerie', uploadItem.single("image"), editSerie)

router.get('/getSerie/:id', getSerie)

router.get('/getCap/:id/:cap', getCap)

router.get('/deleteCap/:id/:cap', deleteCap)

router.post('/editCap', uploadItem.array("images", 100), editCap)


router.post('/addCap', uploadItem.array("images", 100), addCap)

router.post('/createComment', createComment)

router.post('/deleteComment', deleteComment)

router.post('/editComment', editComment)

router.get('/searchSeries/:text', searchSerie)

module.exports = router