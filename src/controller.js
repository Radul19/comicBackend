const ctrl = {}
const User = require('./models/User');
const Serie = require('./models/Serie');
const bcrypt = require('bcrypt')
const { v4 } = require('uuid');
const fs = require('fs')
const moment = require('moment');


/// Configuracion de cloudinary para subir imagenes
const cloudinary = require("cloudinary").v2
cloudinary.config({
    cloud_name: "comicseries",
    api_key: 317699299852547,
    api_secret: "8MwOkn2RLuQxxJ7gOzDKuif2ofs",
})

// Funcion para ordenar las imagenes
const compare = (a, b) => {
    if (a.num < b.num) {
        return -1;
    }
    if (a.num > b.num) {
        return 1;
    }
    return 0;
}

//ROUTES///////////////////////////

// Ruta home para verificar
ctrl.home = (req, res) => {
    res.send('hey home')
}

// Ruta login 
ctrl.login = async (req, res) => {

    // Se extraen los datos del route params al usar router.get(algunaruta/:username/:password,function)
    const { username, password } = req.params
    const searchUsername = await User.findOne({ username })

    // Si el usuario existe
    if (searchUsername) {
        const passwordValidator = bcrypt.compareSync(password, searchUsername.password)
        // Si la contraseña coincide
        if (passwordValidator) {
            const { email, admin, id, picture } = searchUsername
            return res.json({
                username, email, admin, id, picture, admin
            })
        } else {
            return res.status(404).json({
                ok: false,
                msg: "Contraseña incorrecta"
            })
        }
    } else {
        return res.status(404).json({
            ok: false,
            msg: "No hay usuario registrado con ese nombre"
        })
    }

}

// Route de registro
ctrl.register = async (req, res) => {

    let admin = false
    // Se extraen las variables que llegan al router.post()
    const { username, email, password, adminCode } = req.body.data
    const searchUsername = await User.findOne({ username })
    const searchEmail = await User.findOne({ email })

    // Si el nombre de usuario esta en uso
    if (searchUsername) {
        return res.status(406).json({
            ok: false,
            msg: "El nombre de usuario ya estan en uso"
        })
    }
    // Si el correo esta en uso
    if (searchEmail) {
        return res.status(406).json({
            ok: false,
            msg: "El correo ya estan en uso"
        })
    }
    // Si el codigo de admin es correcto, cambia la variable a true
    if (adminCode === '123') {
        admin = true
    }

    // Crea el hash de la contraseña
    const salt = bcrypt.genSaltSync()
    const cryptPass = bcrypt.hashSync(password, salt)

    // Crea el ID
    const id = v4()

    // Crea el usuario y registralo en la BD usando .save()
    const newUser = new User({ username, email, password: cryptPass, admin, id });
    await newUser.save()
    const picture = 'https://res.cloudinary.com/comicseries/image/upload/v1649827898/imgThumb_svogrq.png'
    res.json({ username, email, id, admin, picture, id })
}

// Añadir Serie
ctrl.addSerie = async (req, res) => {

    // Extrale la direccion en donde cae la imagen de la serie (Public/Uploads)
    const { path } = req.file
    try {

        // La informacion llega en FormData para porder transferir imagenes, por ende la "data" llega en forma de STRING
        // y debe ser convertida en objecto para ser procesada, usando JSON.parse()
        const data = JSON.parse(req.body.data)
        const { title, description, ownerId } = data

        // Sube la imagen a Cloudinary
        const result = await cloudinary.uploader.upload(path)

        // una vez que se suba la imagen a Cloudinary borra la imagen de Public/Uploads
        fs.unlinkSync(path)

        // Se crea una variable de los capitulos que esta vacia
        const caps = [{
            comments: { a: '' },
            images: []
        }
        ]

        // Se guarda la serie en la DB
        const newSerie = new Serie({ title, description, ownerId, picture: result.url, picture_public_id: result.public_id });
        await newSerie.save()
        res.json({
            ok: 'hey its ok'
        })

        //En caso de Error
    } catch (error) {
        fs.unlinkSync(path)
        res.status(400).json({
            ok: false,
            msg: 'Ha ocurrido un error al insertar los datos, intente nuevamente'
        });
    }
}


// Get profile
ctrl.getProfile = async (req, res) => {


    // Extraer el id del usuario mediante el req.params
    const { id } = req.params
    const searchSerie = await Serie.find({ ownerId: id })
    const searchUser = await User.findOne({ id })
    // console.log(searchUser)

    // Conseguir las series y los datos del usuario para ser enviados al Front
    if (searchSerie && searchUser) {
        const { username, email, admin, id, picture } = searchUser
        res.json({
            series: searchSerie,
            userData: { username, email, admin, id, picture }
        })

        // En caso de que no encuentre nada
    } else {
        res.status(404).json({
            ok: false,
            msg: "Ha ocurrido un error al cargar el perfil, intente nuevamente"
        })
    }
}

// Borrar serie
ctrl.deleteSerie = async (req, res) => {

    // Extraer el id de la serie
    const { id } = req.params

    const searchSerie = await Serie.findOne({ picture_public_id: id })
    // Si la serie existe
    if (searchSerie) {
        // Borra la serie y eliminala de cloudinary
        await searchSerie.deleteOne()
        const deletedPicture = await cloudinary.uploader.destroy(id)
        res.json({
            ok: true
        })
        // Si la serie no existe
    } else {
        res.status(404).json({
            ok: false,
            msg: "No se ha encontrado la serie buscada, intente nuevamente"
        })
    }
}


// Conseguir serie mediante ID
ctrl.getSerie = async (req, res) => {
    const { id } = req.params
    const searchSerie = await Serie.findOne({ picture_public_id: id })
    if (searchSerie) {
        res.json({ data: searchSerie })
    } else {
        res.status(404).json({
            ok: false,
            msg: "No se ha encontrado la serie buscada, intente nuevamente"
        })
    }
}


// Actualizar perfil
ctrl.updateProfile = async (req, res) => {

    // Try catch consiste en intentar todo lo que esta dentro y ocurre un error envialo al front
    try {

        // Extraer todos los datos , tanto la imagen enviada como el nombre de usuario
        const { path } = req.file
        const data = JSON.parse(req.body.data)
        const { id, username } = data

        //Buscar el id del usuario
        const searchUser = await User.findOne({ id })

        // Subir imagen a cloudinary
        const result = await cloudinary.uploader.upload(path)

        //Eliminar la imagen de Public/Upload
        fs.unlinkSync(path)

        // Actualizar los datos y guardar
        searchUser.username = username
        searchUser.picture = result.url
        await searchUser.save()

        // Se envia el enlace de la nueva foto de perfil
        res.json({
            ok: true,
            data: result.url
        })

        // En caso de algun error
    } catch (error) {
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error inesperado al actualizar los datos, intente nuevamente'
        })
    }
}

// Editar serie
ctrl.editSerie = async (req, res) => {

    // Otro try/catch
    try {


        // Extraer datos
        const data = JSON.parse(req.body.data)
        const { description, title, id } = data

        // Conseguir serie mediante id ( La id de la serie es igual a la id de su portada)
        const searchSerie = await Serie.findOne({ picture_public_id: id })
        const { path } = req.file

        // Eliminar la imagen anterior
        await cloudinary.uploader.destroy(id)

        // Subir la nueva imagen
        const result = await cloudinary.uploader.upload(path)
        const { url, public_id } = result

        // Borrar la imagen de Public/Uploads
        fs.unlinkSync(path)

        // Actualizar datos
        searchSerie.title = title
        searchSerie.description = description
        searchSerie.picture = url
        searchSerie.picture_public_id = public_id

        // Guardar datos
        await searchSerie.save()

        res.json({
            ok: true
        })

        // En caso de error
    } catch (error) {
        console.log(error)
        res.status(599).json({
            data: {
                ok: false,
                msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
            }
        })
    }
}


// Conseguir capitulo mediante ID de la serie y el numero del capitulo
ctrl.getCap = async (req, res) => {

    // Extraer datos
    const { id, cap } = req.params

    // Conseguir serie mediante ID
    const searchSerie = await Serie.findOne({ picture_public_id: id })


    // Si la serie existe devuelve el contenido del capitulo basandose en serie.cap[index]
    if (searchSerie) {
        res.json({
            images: searchSerie.caps[cap - 1].images,
            comments: searchSerie.caps[cap - 1].comments,
            title: searchSerie.title
        })


        // Si la serie no existe
    } else {
        res.status(404).json({
            data: {
                ok: false,
                msg: 'No se ha encontrado la serie que ha buscado.'
            }
        })
    }



}

// Eliminar capitulo
ctrl.deleteCap = async (req, res) => {

    // Extraer datos
    const { id, cap } = req.params

    // Conseguir serie mediante ID
    const searchSerie = await Serie.findOne({ picture_public_id: id })

    // Si la serie existe elimina 1 capitulo en el index seleccionado
    if (searchSerie) {
        searchSerie.caps.splice(cap - 1, 1)
        await searchSerie.save()

        // Se envian los datos de la serie
        res.json({ data: searchSerie })


        // Si la serie no existe
    } else {
        res.status(404).json({
            data: {
                ok: false,
                msg: 'No se ha encontrado la serie que ha buscado.'
            }
        })
    }
}


// Añadir capitulo 
ctrl.addCap = async (req, res) => {

    // Try catch
    try {

        // Extraer datos
        const id = JSON.parse(req.body.id)

        // Buscar serie
        const searchSerie = await Serie.findOne({ picture_public_id: id })

        // Crear constante donde se almacenaran todos los datos del capitulo
        const capsContainer = {
            comments: [],
            images: []
        }


        // Promesa que esperará a que todo dentro de ella se ejecute antes de continuar
        await Promise.all(
            // Por cada imagen enviada
            req.files.map(async (item, index) => {

                // Extrae la direccion de la imange de Public/Uploads y sube la imagen a cloudinary
                const { path } = item
                const result = await cloudinary.uploader.upload(path)

                // Extrae los datos de la imagen
                const { url, public_id } = result

                // Insertar a la constante que creamos anteriormente capsContainer
                capsContainer.images.push({ url, public_id, num: item.originalname })

                // Eliminamos la imagen de Public/Uploads
                fs.unlinkSync(path)
                return 0
            })
        )

        // Una vez subido todas las imagenes del capitulo, las ordenamos usando la funcion creada al inicio, Compare
        capsContainer.images.sort(compare)

        // Una vez nuestra constante este lista, la incluimos a los capitulos de la BD, usando push() y guardamos
        searchSerie.caps.push(capsContainer)
        await searchSerie.save()
        res.json({
            ok: true
        })

        // En caso de algun error
    } catch (error) {
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }

}


// Editar capitulo
ctrl.editCap = async (req, res) => {

    // Try catch
    try {

        // Extraer datos
        const { id, cap } = JSON.parse(req.body.data)

        // Conseguir serie mediante id
        const searchSerie = await Serie.findOne({ picture_public_id: id })

        // Por cada imagen que tenga el capitulo, eliminala de cloudinary
        await Promise.all(
            searchSerie.caps[cap - 1].images.map(async (item, index) => {
                await cloudinary.uploader.destroy(item.public_id)

                return 0
            })
        )

        // Copia los capitulos que tenga la serie en una nueva constante
        const copyCaps = searchSerie.caps

        // Vacia las imagenes de la nueva constante pero se mantienen los comentarios
        copyCaps[cap - 1].images = []

        // Promesa
        await Promise.all(

            // Por cada imagen recibida, se sube a cloudinary y luego se almacenan los datos en las imagenes de
            // la variable CopyCaps en el Index del capitulo (copyCaps[cap - 1])
            req.files.map(async (item, index) => {
                const { path } = item
                const result = await cloudinary.uploader.upload(path)
                const { url, public_id } = result
                await copyCaps[cap - 1].images.push({ url, public_id, num: item.originalname })

                //Se borra la imagen de Public/Uploads
                fs.unlinkSync(path)
                return 0
            })
        )

        // Se ordenan las imagenes
        copyCaps[cap - 1].images.sort(compare)

        // Se vacía la variable Caps de la Base de Datos para ser reemplazada por la constante CopyCaps con las nuevas imagenes del capitulo
        // -- Se debe actualizar toda la variable Caps porque de no ser asi, no se registran los cambios
        searchSerie.caps = []
        searchSerie.caps = [...copyCaps]
        await searchSerie.save()
        res.json({
            ok: true
        })


        // En caso de error
    } catch (error) {
        console.log(error)
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }
}

// Crear comentario
ctrl.createComment = async (req, res) => {

    // Try catch
    try {

        // Se extraen los datos
        const { id, cap, username, profile_pic, text } = req.body

        // Conseguir serie mediante ID
        const searchSerie = await Serie.findOne({ picture_public_id: id })

        // La fecha del dia usando Moment.js, en formato Year-Mont-Day
        const date = moment().format('YYYY-MM-DD')

        // Copiar toda la variable Caps en una nueva constante (Igual que en editCap() )
        const copyCaps = searchSerie.caps


        // Se añade el comentario al capitulo
        await copyCaps[cap].comments.push({
            username, profile_pic, text, date
        })

        // Se vacía la variable Caps de la Base de Datos para ser reemplazada por la constante CopyCaps con el comentario del capitulo
        searchSerie.caps = []
        searchSerie.caps = [...copyCaps]

        // Se guardan los datos
        await searchSerie.save()

        // Se envian los datos de la serie
        res.json({ data: searchSerie })

    } catch (error) {
        // console.log(error)
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }
}


// Eliminar comentario
ctrl.deleteComment = async (req, res) => {

    // Try catch
    try {

        // Se extraen los datos
        const { id, cap, index } = req.body

        // Se busca la serie por ID
        const searchSerie = await Serie.findOne({ picture_public_id: id })

        // Copiar los capitulos en nueva constante
        const copyCaps = searchSerie.caps

        // Eliminar comentario mediante el index del mismo
        await copyCaps[cap].comments.splice(index, 1)

        // Vaciar variable para ser remplazada por la misma sin el comentario
        searchSerie.caps = []
        searchSerie.caps = [...copyCaps]
        await searchSerie.save()

        // Se envia la serie
        res.json({ data: searchSerie })


        // En caso de error
    } catch (error) {
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }

}

// Editar comentario
ctrl.editComment = async (req, res) => {

    // Try catch
    try {

        // Extraer datos
        const { id, cap, index, text } = req.body

        // Conseguir serie
        const searchSerie = await Serie.findOne({ picture_public_id: id })

        // Eliminar comentario mediante el index del mismo
        const copyCaps = searchSerie.caps

        // Eliminar comentario mediante el index del mismo
        copyCaps[cap].comments[index].text = text

        // Vaciar variable para ser remplazada por la misma con el comentario editado
        searchSerie.caps = []
        searchSerie.caps = [...copyCaps]
        await searchSerie.save()
        res.json({ data: searchSerie })

        // En caso de error
    } catch (error) {
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }
}


// Busqueda de serie
ctrl.searchSerie = async (req, res) => {

    // Variable vacia donde se almacenara la serie si se encuentra una
    let searchSerie

    // Se extrae el texto que se desea buscar
    const { text } = req.params

    // Desde el front, cuando se carga por primera vez la pagina Search, se envia un "_" para poder buscar todas las series
    // una vez que se ha buscado algo y se borra todo el input, se puede recibir un STRING vacio " "  y se buscan todas las series
    if (text === '_' || text === '') {
        searchSerie = await Serie.find()
    } else {
        // En el caso de que el buscador tenga un texto, usa una expresion regular (regex) para hacer match con el titulo de las series
        searchSerie = await Serie.find({ title: { $regex: text } })
    }

    // Si se encontraron series, envialas al front
    if (searchSerie) {
        res.json({ data: searchSerie })

        // En caso de no encontrar ninguna serie envia un mensaje
    } else {
        res.status(404).json({
            ok: false,
            msg: 'No se han coincidido los resultados de busqueda'
        })
    }

}

module.exports = ctrl