const { Schema, model } = require('mongoose')
const bcrypt = require('bcrypt')

const SerieSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    picture: { type: String, required: true },
    ownerId: { type: String, required: true },
    picture_public_id: { type: String, required: true },
    caps: { type: Array, required: true },

    // picture:{type:String,default:'/img/user.png'},
    // username: { type: String, required: true },
    // description: { type: String, default:'' },
    // email: { type: String, required: true },
    // password: { type: String, required: true },
    // followers: { type: Array, default: '0' },
    // following: { type: Array, default: '0' },
    // hidden: { type: Boolean },
    // notifyTotal:{type:Number,default:0},
    // notifySeen:{type:Number,default:0}
})


module.exports = model('Serie', SerieSchema)