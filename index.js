const express = require('express')
const app = express()
const nodemailer = require('nodemailer')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const {
    Schema
} = mongoose;
const url = `${process.env.MONGOOSE_URL}`
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path');
const {
    v4: uuidv4
} = require('uuid');


app.use(express.static(path.join(__dirname, '/views')))
app.use(express.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(cookieParser());


const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "juanchodelarosa11173663@gmail.com",
        pass: "itrlwghkrunawqtj"
    }
})

function sendEmail(mail) {
    var mailOptions = {
        from: mail.from,
        to: mail.to,
        replyTo: null,
        subject: mail.subject,
        html: `${mail.body}`,
    }
    transport.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err)
        } else {
            console.log('email sent')
        }
    })
}

mongoose.connect(process.env.CLUSTER, {
    'useNewUrlParser': true,
    'useUnifiedTopology': true
}).catch(err => {
    console.log(err);
})

const schema = new Schema({
    art: {
        type: String,
    },
    art_number: {
        type: Number,
    },
    palabras_clave: {
        type: String,
    },
    desc: {
        type: String
    },
    img_change: {
        type: Array
    },
    main_img: String,
    producto: String,
    categoria: String,
    sub_category: {
        type: String,
    },
    ofertas: {
        type: String
    },
    precio_mayor: {
        type: Number
    },
}, {
    collection: "Users"
})
const users = mongoose.model('Users', schema)

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname, 'index.html'))
})
app.get('/login', (req,res)=>{
    res.sendFile(path.join(__dirname, 'login.html'))
})
app.listen(3000)