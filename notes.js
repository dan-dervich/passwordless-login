const express = require('express')
const app = express()
const nodemailer = require('nodemailer')
const compression = require('compression')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const {
    Schema
} = mongoose;
const url = `${process.env.MONGOOSE_URL}`
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const fileupload = require("express-fileupload");
const fs = require('fs')
const multer = require('multer')
const path = require('path');
const {
    v4: uuidv4
} = require('uuid');
var upload = multer({
    dest: '/views/uploads/',
})

app.use(fileupload());
app.use(express.static(path.join(__dirname, '/views')))
app.use(express.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(cookieParser());
app.use(compression())

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
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(url, () => {
    const Posts = mongoose.model('Posts', new Schema({
        name: String,
        quote: String
    }));
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
        password: String,
        posts: [{
            author: {
                type: String
            },
            post: {
                type: String
            },
            img_name: {
                type: String
            },
            comments: []
        }]
    })
    const Users = mongoose.model('Users', schema)

    app.get('/', (req, res) => {
        //    welcome page
        res.sendFile(path.join(__dirname, 'index.html'))
    })

    app.get('/posts', (req, res) => {
        jwt.verify(req.cookies['token'],
            process.env.JWTSecret,
            (err, verifiedJwt) => {
                if (err) {
                    // res.json(err.message);
                    console.log(err.message);
                    res.redirect('/sign-up')
                } else {
                    var verifjwt = verifiedJwt
                    // res.setHeader('Set-Cookie', `token = ${token}; path=/posts; max-age=31536000`)
                    res.setHeader('Set-Cookie', `Username = ${verifiedJwt.payload.username}; path=/; max-age=3600; SameSite=none; Secure `)
                    res.sendFile(path.join(__dirname, 'views', 'posts.html'))
                }
            })
    })

    app.post('/quotes', async (req, res) => {
        await Users.updateOne({
            "username": `${req.cookies['Username']}`
        }, {
            $addToSet: {
                "posts": [{
                    "post": `${req.body.post}`,
                    "author": `${req.cookies['Username']}`
                }]
            }
        })
        try {
            Users.updateOne({
                "username": `${req.cookies['username']}`
            }, {
                $set: {
                    "posts": {
                        "post": `${req.body.post}`,
                        "author": `${req.cookies['Username']}`
                    }
                }
            })
        } catch (err) {
            console.log(err)
        }
        res.redirect('/posts')
    })
    app.get('/create', (req, res) => {
        jwt.verify(req.cookies['token'],
            process.env.JWTSecret,
            (err, verifiedJwt) => {
                if (err) {
                    // res.json(err.message);
                    res.redirect('/sign-up')
                } else {
                    var verifjwt = verifiedJwt
                    res.setHeader('Set-Cookie', `Username = ${verifiedJwt.payload.username}; path=/; max-age=31536`)
                    res.sendFile(path.join(__dirname, 'views', 'create twig.html'))
                }
            })
    })
    app.get('/search-for-accounts', (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'search.html'))
    })
    app.get('/search/:id', async (req, res) => {
        const algo = await Users.find({
            "username": {
                $regex: new RegExp(".*" + `${req.params.id}` + ".*", "i")
            }
        })
        res.json(algo)
    })
    app.get('/quotes/', async (req, res) => {
        jwt.verify(req.cookies['token'],
            process.env.JWTSecret,
            async (err, verifiedJwt) => {
                if (err) {
                    res.redirect('/sign-up')
                } else {
                    const docs = await Users.aggregate(
                        [{
                                $project: {
                                    posts: {
                                        $map: {
                                            input: "$posts",
                                            as: "out",
                                            in: "$$out"
                                        }
                                    }
                                }
                            },
                            {
                                $sample: {
                                    size: 200
                                }
                            }
                        ]
                    )
                    res.setHeader('Set-Cookie', `Username = ${verifiedJwt.payload.username}; path=/; max-age=31536`)

                    res.json({
                        "posts": docs
                    })
                    try {
                        Users.find()
                    } catch (err) {
                        console.log(err)
                    }
                }
            }
        )
    })
    app.get('/_id/:id', (req, res) => {
        jwt.verify(req.cookies['token'],
            process.env.JWTSecret, async (err, verifiedJwt) => {
                if (err) {
                    // res.json(err.message);
                    res.redirect('/sign-up')
                } else {
                    res.redirect('/posts')
                }
            })
    })

    app.get('/sign-up', (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'signup.html'))
    })
    app.get('/err', (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'err.html'))
    })
    app.post('/sign-up/token', async (req, res, next) => {

        // error here:
        // const new_user = await new Users({ username: req.body.username, password: req.body.password, email: req.body.email })
        // new_user.save()
        const find = await Users.findOne({
            "username": req.body.username
        })
        const find1 = await Users.findOne({
            "email": req.body.email
        })
        if (find == null && find1 == null) {
            res.setHeader('Set-Cookie', `username=${req.body.username}; path=/token-verify/; max-age=315`)
            res.setHeader('Set-Cookie', `email=${req.body.email}; path=/token-verify/; max-age=315`)
            res.setHeader('Set-Cookie', `password=${req.body.password}; path=/token-verify/; max-age=315`)
            payload = {
                email: req.body.email,
                username: req.body.username,
                password: req.body.password,
                exp: 300
            }
            // now all of our data is stored to the JWT
            const token = await jwt.sign({
                    payload
                },
                process.env.JWTSecret, {
                    algorithm: 'HS256'
                },
            )

            mail = {
                from: 'juanchodelarosa11173663@gmail.com',
                to: req.body.email,
                subject: 'Your Twiggler Verification Email',
                body: `<h1>Verify Your email:</h1> <br> <h4>https://dan-dervich.github.io/passwordless-login/token-verify/${token}</h4> <br> <p>You have 5mins to verify before your link expires</p>`
            }
            sendEmail(mail)
            res.redirect('/waiting-for-verification');
        } else {
            console.log('found-an-acc-with-that-email-or-username')
            res.redirect('/err')
        }
    })
    app.get('/waiting-for-verification', (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'verif.html'))
    })
    app.get('/token-verify/:id', async (req, res) => {
        jwt.verify(req.params.id,
            process.env.JWTSecret,
            (err, verifiedJwt) => {
                if (err) {
                    // res.json(err.message);
                    console.log(err.message);
                    res.redirect('/sign-up')
                } else {
                    const verifjwt = verifiedJwt
                    try {
                        console.log(verifiedJwt.payload.username)
                        const new_user = new Users({
                            username: verifiedJwt.payload.username,
                            password: verifiedJwt.payload.password,
                            email: verifiedJwt.payload.email
                        })
                        new_user.save()
                    } catch {
                        res.redirect('/err')
                        return;
                    }
                    payload = {
                        username: verifiedJwt.payload.username,
                        password: verifiedJwt.payload.password,
                        email: verifiedJwt.payload.email
                    }
                    const token = jwt.sign({
                            payload
                        },
                        process.env.JWTSecret, {
                            expiresIn: "1h"
                        }, {
                            algorithm: 'HS256'
                        },
                    )
                    res.setHeader('Set-Cookie', `token = ${token}; Username = ${verifjwt.payload.username}; path=/; max-age=3600; SameSite=none; Secure`)
                    res.redirect('/posts')
                }
            })
    })
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'login.html'))
    })
    app.get('/login/err', (req, res) => {
        res.send('no pudimos encontrar su pagina vaya para atras :> (trenyo esto es temporal desp lo voy a cambiar para que sea mas lindo y eso)')
    })
    app.post('/login/verify', async (req, res) => {

        const find = await Users.findOne({
            "username": `${req.body.username}`,
            "password": `${req.body.password}`
        })
        if (find == null) {
            console.log(find)
            res.redirect('/login/err')
        } else {
            payload = {
                username: req.body.username,
                password: req.body.password,
            }
            // now all of our data is stored to the JWT
            const token = jwt.sign({
                    payload
                },
                process.env.JWTSecret, {
                    algorithm: 'HS256'
                },
            )
            res.setHeader('Set-Cookie', `token=${token}; path=/; max-age=3153`)
            res.redirect('/posts');
        }
    })
    app.get('/changepwd', (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'sendmail.html'))
    })
    app.post('/changepwd', async (req, res) => {
        const find = await Users.findOne({
            "email": req.body.email
        })
        if (find == null) {
            res.redirect('/err')
        } else {
            const payload = {
                email: req.body.email,
                exp: '300s'
            }
            const token = jwt.sign({
                payload
            }, process.env.JWTSecret, {
                algorithm: 'HS256',
                expiresIn: 300
            })
            mail = {
                from: 'juanchodelarosa11173663@gmail.com',
                to: req.body.email,
                subject: 'Change Your Twiggler Password',
                body: `<h1>Change Your Twiggler Password:</h1> <br> <h4>https://dan-dervich.github.io/passwordless-login/changepwd/${token}</h4>`
            }
            sendEmail(mail)
            res.send('waiting...')
        }
    })
    app.get('/changepwd/:id', (req, res) => {
        jwt.verify(req.params.id,
            process.env.JWTSecret,
            async (err, verifiedJwt) => {
                if (err) {
                    // res.json(err.message);
                    console.log(err.message);
                    res.redirect('/login')
                } else {
                    const verifjwt = verifiedJwt
                    res.sendFile(path.join(__dirname, 'views', 'change.html'))
                }
            })
    })
    app.post('/changepwd/:id', async (req, res) => {
        jwt.verify(req.params.id,
            process.env.JWTSecret,
            async (err, verifiedJwt) => {
                if (err) {
                    // res.json(err.message);
                    console.log(err.message);
                    res.redirect('/login')
                } else {
                    const verifjwt = verifiedJwt
                    try {
                        await Users.updateOne({
                            "email": `${verifjwt.payload.email}`
                        }, {
                            $set: {
                                "password": `${req.body.password}`
                            }
                        })
                        res.redirect('/login')
                    } catch {
                        res.redirect('/err')
                    }
                }
            })
    })
    app.get('/img', (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'upload_img.html'))
    })

    app.post('/img', async (req, res) => {
        if (req.files.avatar.size > 2000000) {
            res.send("sorry but your image is either to big or you didn't insert text :(")
        } else {
            upload.single('avatar')
            const createFile = (filePath, fileContent) => {
                fs.writeFile(filePath, fileContent, (error) => {
                    if (error) {
                        console.log(error)
                    } else {
                        return 'hola'
                    }
                })
            }
            const id = uuidv4()
            const path = __dirname + '/views/uploads/' + id + req.files.avatar.name
            const content = req.files.avatar.data
            createFile(path, content)
            await Users.updateOne({
                "username": `${req.cookies['Username']}`
            }, {
                $addToSet: {
                    "posts": {
                        "img_name": id + req.files.avatar.name,
                        "author": req.cookies['Username'],
                        "post": req.body.post
                    }
                }
            })
            try {
                Users.updateOne({
                    "username": `${req.cookies['username']}`
                }, {
                    $set: {
                        "posts": {
                            "post": `${req.body.post}`,
                            "author": `${req.cookies['Username']}`,
                            "img_name": `${id + req.files.avatar.name}`
                        }
                    }
                })
            } catch (err) {
                console.log(err)
            }
            // var nude = require('nude');
            // nude.scan('/views/uploads/' + id + req.files.avatar.name, function(res) {
            //     console.log('Contains nudity: ' + res);
            //   });
            res.redirect('/posts')
            //   res.json({"message": "file uploaded"});
        }
    });
    app.get('/delete-post/:id', async (req, res) => {
        const docs = await Users.updateOne({
            "posts.author": req.cookies['Username']
        }, {
            $pull: {
                "posts": {
                    "_id": req.params.id
                }
            }
        }, )
        res.json(docs)
        // const docs = await Users.deleteOne({"posts._id": req.params.id})
        // res.json(docs)
    })
    app.post('/delete-post/:id', async (req, res) => {
        jwt.verify(req.cookies['token'],
            process.env.JWTSecret,
            async (err, verifiedJwt) => {
                if (err) {
                    // res.json(err.message);
                    console.log(err.message);
                    res.redirect('/sign-up')
                } else {
                    const docs = await Users.updateOne({
                        "username": verifiedJwt.payload.username
                    }, {
                        $pull: {
                            "posts": {
                                "_id": req.params.id
                            }
                        }
                    })
                    // this ^ function deletes a post with that username and with that id 
                    // do an if found and deleted redirect to posts or profile page
                    // else res.SendFile deleteposterror.html
                    res.setHeader('Set-Cookie', `Username = ${verifiedJwt.payload.username}; path=/; max-age=3600; SameSite=none; Secure `)
                    res.json(docs)
                }
            })
    })
    app.get('/edit-post/:id', (req, res) => {
        // jwt.verify
        res.sendFile(path.join(__dirname, 'views', 'edit-post.html'))
    })
    app.post('/edit-post/:id', async (req, res) => {
        // jwt.verify
        // do not find by id cause it will destroy the whole post
        // find by req.cookie['Username']
        try {
            await Users.updateOne({
                "posts._id": req.params.id,
                "username": req.cookies['Username']
            }, {
                $set: {
                    "posts.$.post": req.body.post
                }
            })
            res.redirect('/posts')
        } catch (err) {
            console.log(err)
        }
    })
    app.get('/edit-post-get-info/:id', async (req, res) => {
        const docs = await Users.findOne({
            "_id": req.params.id
        })
        res.json(docs)
    })
    app.get('/comments/:id', (req,res)=>{
        res.sendFile(path.join(__dirname, 'views', 'comments.html'))
    })
    app.post('/comments/:id', async (req,res)=>{
        const docs = await Users.updateOne({"posts._id": req.params.id}, {$addToSet: {"posts.comments": ["hola"]}} )
        res.json(docs)
    })
})

app.listen(3000, '0.0.0.0')