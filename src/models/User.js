const { Schema, model } = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    admin: { type: Boolean, required: true },
    id: { type: String, required: true },
    picture: { type: String, default: 'https://res.cloudinary.com/comicseries/image/upload/v1649827898/imgThumb_svogrq.png', required: true },
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

UserSchema.methods.encryptPassword = async (password) => {
    /// Se genera primero la "salt" que es como el algoritmo con el que se va a encriptar
    const salt = bcrypt.genSaltSync()
    return await bcrypt.hash(password, salt);
};

UserSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};


module.exports = model('User', UserSchema)