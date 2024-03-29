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
    api_key: "" , /*Add api key*/
    api_secret: "", /* Add api secret */
})

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


ctrl.home = (req, res) => {
    res.send('hey home')
}

ctrl.login = async (req, res) => {

    const { username, password } = req.params
    const searchUsername = await User.findOne({ username })
    if (searchUsername) {
        const passwordValidator = bcrypt.compareSync(password, searchUsername.password)
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

ctrl.register = async (req, res) => {
    console.log(req.body.data)
    let admin = false
    const { username, email, password, adminCode } = req.body.data
    const searchUsername = await User.findOne({ username })
    const searchEmail = await User.findOne({ email })
    if (searchUsername) {
        return res.status(406).json({
            ok: false,
            msg: "El nombre de usuario ya estan en uso"
        })
    }
    if (searchEmail) {
        return res.status(406).json({
            ok: false,
            msg: "El correo ya estan en uso"
        })
    }
    if (adminCode === '123') {
        admin = true
    }
    const salt = bcrypt.genSaltSync()
    const cryptPass = bcrypt.hashSync(password, salt)

    const id = v4()
    const newUser = new User({ username, email, password: cryptPass, admin, id });
    await newUser.save()
    const picture = 'https://res.cloudinary.com/comicseries/image/upload/v1649827898/imgThumb_svogrq.png'
    res.json({ username, email, id, admin, picture, id })
}

ctrl.addSerie = async (req, res) => {

    const { path } = req.file
    try {
        const data = JSON.parse(req.body.data)

        const { title, description, ownerId } = data
        const result = await cloudinary.uploader.upload(path)
        fs.unlinkSync(path)

        const caps = [{
            comments: { a: '' },
            images: []
        }
        ]

        const newSerie = new Serie({ title, description, ownerId, picture: result.url, picture_public_id: result.public_id });
        await newSerie.save()
        res.json({
            ok: 'hey its ok'
        })

    } catch (error) {
        fs.unlinkSync(path)
        res.status(400).json({
            ok: false,
            msg: 'Ha ocurrido un error al insertar los datos, intente nuevamente'
        });
    }
    // console.log(req.file)

}

ctrl.getProfile = async (req, res) => {
    const { id } = req.params
    const searchSerie = await Serie.find({ ownerId: id })
    const searchUser = await User.findOne({ id })
    // console.log(searchUser)
    if (searchSerie && searchUser) {
        const { username, email, admin, id, picture } = searchUser
        res.json({
            series: searchSerie,
            userData: { username, email, admin, id, picture }
        })
    } else {
        res.status(404).json({
            ok: false,
            msg: "Ha ocurrido un error al cargar el perfil, intente nuevamente"
        })
    }
}

ctrl.deleteSerie = async (req, res) => {
    const { id } = req.params
    const searchSerie = await Serie.findOne({ picture_public_id: id })
    if (searchSerie) {
        await searchSerie.deleteOne()
        const deletedPicture = await cloudinary.uploader.destroy(id)
        res.json({
            ok: true
        })
    } else {
        res.status(404).json({
            ok: false,
            msg: "No se ha encontrado la serie buscada, intente nuevamente"
        })
    }
}

ctrl.getSerie = async (req, res) => {
    const { id } = req.params
    const searchSerie = await Serie.findOne({ picture_public_id: id })
    // console.log(searchSerie)
    if (searchSerie) {
        res.json({ data: searchSerie })
    } else {
        res.status(404).json({
            ok: false,
            msg: "No se ha encontrado la serie buscada, intente nuevamente"
        })
    }
}

ctrl.updateProfile = async (req, res) => {
    try {
        const { path } = req.file
        const data = JSON.parse(req.body.data)
        const { id, username } = data
        const searchUser = await User.findOne({ id })
        const result = await cloudinary.uploader.upload(path)
        fs.unlinkSync(path)
        searchUser.username = username
        searchUser.picture = result.url
        await searchUser.save()
        res.json({
            ok: true,
            data: result.url
        })
    } catch (error) {
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error inesperado al actualizar los datos, intente nuevamente'
        })
    }
}


ctrl.editSerie = async (req, res) => {

    try {
        console.log(req.file)
        const data = JSON.parse(req.body.data)
        const { description, title, id } = data
        console.log(data)

        console.log("fine?1")
        const searchSerie = await Serie.findOne({ picture_public_id: id })
        const { path } = req.file


        console.log("fine?2")
        await cloudinary.uploader.destroy(id)

        const result = await cloudinary.uploader.upload(path)
        const { url, public_id } = result
        console.log("fine?3")


        fs.unlinkSync(path)
        searchSerie.title = title
        searchSerie.description = description
        searchSerie.picture = url
        searchSerie.picture_public_id = public_id

        console.log(searchSerie)

        await searchSerie.save()

        res.json({
            ok: true
        })
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


ctrl.getCap = async (req, res) => {
    const { id, cap } = req.params
    const searchSerie = await Serie.findOne({ picture_public_id: id })
    if (searchSerie) {
        res.json({
            images: searchSerie.caps[cap - 1].images,
            comments: searchSerie.caps[cap - 1].comments,
            title: searchSerie.title
        })
    } else {
        res.status(404).json({
            data: {
                ok: false,
                msg: 'No se ha encontrado la serie que ha buscado.'
            }
        })
    }



}


ctrl.deleteCap = async (req, res) => {
    const { id, cap } = req.params
    const searchSerie = await Serie.findOne({ picture_public_id: id })
    if (searchSerie) {
        searchSerie.caps.splice(cap - 1, 1)
        await searchSerie.save()
        res.json({ data: searchSerie })
    } else {
        res.status(404).json({
            data: {
                ok: false,
                msg: 'No se ha encontrado la serie que ha buscado.'
            }
        })
    }
}


ctrl.addCap = async (req, res) => {
    try {
        const id = JSON.parse(req.body.id)
        // console.log(id)
        const searchSerie = await Serie.findOne({ picture_public_id: id })
        const length = searchSerie.caps.length
        // console.log(length)
        // searchSerie.cap.append([])
        // array.forEach(element => {

        // });
        console.log(req.files)

        const capsContainer = {
            comments: [],
            images: []
        }



        // let newArr = []
        console.log('Start Promise')
        await Promise.all(
            req.files.map(async (item, index) => {
                const { path } = item
                const result = await cloudinary.uploader.upload(path)
                const { url, public_id } = result
                capsContainer.images.push({ url, public_id, num: item.originalname })
                console.log(capsContainer.images)
                fs.unlinkSync(path)
                return 0
            })
        )


        console.log('After Compare')
        capsContainer.images.sort(compare)
        console.log('////////')

        searchSerie.caps.push(capsContainer)
        await searchSerie.save()
        res.json({
            ok: true
        })
    } catch (error) {
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }

}


ctrl.editCap = async (req, res) => {
    try {
        const { id, cap } = JSON.parse(req.body.data)
        const searchSerie = await Serie.findOne({ picture_public_id: id })
        await Promise.all(
            searchSerie.caps[cap - 1].images.map(async (item, index) => {
                await cloudinary.uploader.destroy(item.public_id)
                // console.log(req.files[index])
                // const { path } = req.files[index]
                // await cloudinary.uploader.destroy(path)
                return 0
            })
        )
        const copyCaps = searchSerie.caps
        copyCaps[cap - 1].images = []
        // console.log('searchSerie?')
        // console.log(searchSerie.caps[cap - 1].images)
        // console.log(req.files)
        await Promise.all(
            req.files.map(async (item, index) => {
                // console.log(item)
                const { path } = item
                const result = await cloudinary.uploader.upload(path)
                const { url, public_id } = result
                await copyCaps[cap - 1].images.push({ url, public_id, num: item.originalname })
                fs.unlinkSync(path)
                return 0
            })
        )
        // console.log('Another one')
        // console.log(searchSerie.caps[cap - 1].images)

        copyCaps[cap - 1].images.sort(compare)

        searchSerie.caps = []
        searchSerie.caps = [...copyCaps]
        await searchSerie.save()
        res.json({
            ok: true
        })


    } catch (error) {
        console.log(error)
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }
}

ctrl.createComment = async (req, res) => {
    try {
        console.log(req.body)
        const { id, cap, username, profile_pic, text } = req.body

        const searchSerie = await Serie.findOne({ picture_public_id: id })

        const date = moment().format('YYYY-MM-DD')

        const copyCaps = searchSerie.caps



        await copyCaps[cap].comments.push({
            username, profile_pic, text, date
        })
        searchSerie.caps = []
        searchSerie.caps = [...copyCaps]
        console.log(searchSerie.caps[cap].comments)
        await searchSerie.save()
        res.json({ data: searchSerie })

    } catch (error) {
        // console.log(error)
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }
}

ctrl.deleteComment = async (req, res) => {
    try {
        const { id, cap, index } = req.body

        const searchSerie = await Serie.findOne({ picture_public_id: id })

        const copyCaps = searchSerie.caps

        await copyCaps[cap].comments.splice(index, 1)
        searchSerie.caps = []
        searchSerie.caps = [...copyCaps]
        await searchSerie.save()
        res.json({ data: searchSerie })

    } catch (error) {
        // console.log(error)
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }

}
ctrl.editComment = async (req, res) => {
    try {
        console.log(req.body)
        const { id, cap, index, text } = req.body

        const searchSerie = await Serie.findOne({ picture_public_id: id })

        const copyCaps = searchSerie.caps

        copyCaps[cap].comments[index].text = text
        searchSerie.caps = []
        searchSerie.caps = [...copyCaps]
        await searchSerie.save()
        res.json({ data: searchSerie })

    } catch (error) {
        // console.log(error)
        res.status(599).json({
            ok: false,
            msg: 'Ha ocurrido un error al registrar el capitulo, intente nuevamente'
        })
    }
}

ctrl.searchSerie = async (req, res) => {

    let searchSerie

    const { text } = req.params
    console.log(text)
    if (text === '_' || text === '') {
        searchSerie = await Serie.find()
    } else {
        searchSerie = await Serie.find({ title: { $regex: text } })
    }

    if (searchSerie) {
        console.log(searchSerie)
        res.json({ data: searchSerie })
    } else {
        res.status(404).json({
            ok: false,
            msg: 'No se han coincidido los resultados de busqueda'
        })
    }

}

module.exports = ctrl
