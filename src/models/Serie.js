const { Schema, model } = require('mongoose')
const bcrypt = require('bcrypt')

const SerieSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    picture: { type: String, required: true },
    ownerId: { type: String, required: true },
    picture_public_id: { type: String, required: true },
    caps: { type: Array, required: true },
})


module.exports = model('Serie', SerieSchema)