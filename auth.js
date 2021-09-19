const express = require('express')
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

app.use(cookieParser());

async function validate(req, res, method) {
    jwt.verify(method,
        process.env.JWTSecret,
        async (err, verifiedJwt) => {
            if (err) {
                // res.json(err.message);
                console.log(err.message);
                res.redirect('/')
                return false
            } else {
                const payload = {
                    email: verifiedJwt.payload.email,
                    exp: Date.now() + (1000 * 60 * 60) // 1 hour
                }
                console.log(payload);
                const token = await jwt.sign(payload, process.env.JWTSecret, {
                    algorithm: 'HS256',
                })
                // res.setHeader('Set-Cookie', `token = ${token}; path=/posts; max-age=31536000`)
                // res.setHeader('Set-Cookie', `Username = ${verifiedJwt.payload.username}; path=/; max-age=3600; SameSite=none; Secure `)
                res.setHeader('Set-Cookie', `token = ${token}; path=/; max-age=3600; SameSite=none; Secure `)
                return verifiedJwt
            }
        })
}

async function create_jwt(req, expiration) {
    const payload = {
        email: req.body.email,
        exp: Date.now() + (1000 * 60 * 60) //1 hour
    }
    console.log(payload);
    // now all of our data is stored to the JWT
    const token = await jwt.sign({
            payload
        },
        process.env.JWTSecret, {
            algorithm: 'HS256',
        },
    )
    return token
}
module.exports = {
    create_jwt,
    validate
};