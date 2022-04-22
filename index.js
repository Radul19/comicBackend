const express = require('express')
const routes = require('./src/routes')
const app = express()
const cors = require("cors")


require('./src/database')


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use(express.static('public'))

app.use(express.urlencoded({ extended: true }));

app.use(express.json())

app.use(routes)

app.use(cors())



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})
