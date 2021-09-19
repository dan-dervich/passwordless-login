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
const auth = require('./auth')


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
        pass: process.env.EMAIL_PASS
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
    username: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
})
const Users = mongoose.model('Users', schema)

// sign up
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})
app.post('/sign-up', async (req, res) => {
    const token = await auth.create_jwt(req, 300)
    mail = {
        from: 'juanchodelarosa11173663@gmail.com',
        to: req.body.email,
        subject: 'Verification',
        body: `<h1>Verify Your email:</h1> <br> <h4>https://dan-dervich.github.io/passwordless-login/verify-token/${token}</h4> <br> <p>You have 5 minutes to verify before it expires</p>`
    }
    sendEmail(mail)
    res.redirect('/waiting-for-verification')
})
app.get('/verify-token/:id', async (req, res) => {
    const authentication = await auth.validate(req, res, req.params.id)
    if(authentication === false){
        res.redirect('/sign-up')
    }
    else{
        res.redirect('/posts')
    }
})
// login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'))
})
app.post('/login', async (req,res)=>{
    const token = await auth.create_jwt(req, 300)
    mail = {
        from: 'juanchodelarosa11173663@gmail.com',
        to: req.body.email,
        subject: 'Verification',
        body: `<h1>Login</h1> <br> <h4>https://dan-dervich.github.io/passwordless-login/validate-token/${token}</h4> <br> <p>You have 5 minutes to login with this token before it expires</p>`
    }
    sendEmail(mail)
    res.redirect('/waiting-for-verification')
})
app.get('/validate-token/:id', async (req,res)=>{
    const authentication = await auth.validate(req, res, req.params.id)
    if(authentication === false){
        res.redirect('/login')
    }
    else{
        res.redirect('/posts')
    }
})

// user frontend verification
app.get('/users/', async (req, res) => {
    const docs = await Users.findOne({}, {
        email: 0
    })
    res.json({
        docs
    })
})
app.get('/email/', async (req, res) => {
    const docs = await Users.findOne({}, {
        username: 0
    })
    res.json({
        docs
    })
})
// logged in :D
app.get('/posts', async (req, res) => {
    const user_valid = await auth.validate(req, res, req.cookies['token'])
    if (user_valid === false) {
        res.redirect('/login')
    } else {
        res.sendFile(path.join(__dirname, 'posts.html'))
    }
})
app.get('/asdf', async (req,res)=>{
    const docs = await Users.find()
    res.json(docs)
})
// waiting
app.get('/waiting-for-verification', (req, res) => {
    res.sendFile(path.join(__dirname, 'verification.html'))
})
app.listen(3000)