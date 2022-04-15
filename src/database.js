//Connect to MongoDB
const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://user:comicseries123456@comicseries.6fy7c.mongodb.net/comicseries', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(db => console.log('Database is connected'))
    .catch(err => console.log(err))