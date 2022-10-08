const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const db = mysql.createConnection({
    host: 'mysql-aina.alwaysdata.net',
    user: 'aina',
    password: 'wxyzopqrstabcghijkl',
    database: 'aina_chat'
})

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/');

app.get('/api/get/allUser/:authId', (req, res) => {
    const slqSelect = "SELECT * FROM users WHERE id!=?";
    db.query(slqSelect, req.params.authId, (err, result) => {
        if (err) console.log(err);
        res.send(result);
    })
})

app.put('/api/get/messages/:authId', (req, res) => {
    const authId = req.params.authId;
    const userIdClick = req.body.userIdClick;
    const slqSelect = "SELECT users.name, messages.id, messages.message, messages.user_id FROM users, messages, destinations WHERE" + 
    " (messages.user_id=? AND destinations.user_id=? OR messages.user_id=? AND destinations.user_id=?) AND destinations.message_id=messages.id " + 
    " AND destinations.user_id=users.id ORDER by messages.created_at";
    db.query(slqSelect, [authId, userIdClick, userIdClick, authId], (err, result) => {
        if (err) console.log(err);
        const data = {
            authId : authId,
            result : result
        }
        res.send(data);
    })
})

app.put('/api/insert/message/:authId', (req, res) => {
    const authId = req.params.authId;
    const userIdClick = req.body.userIdClick;
    const insertMessage = req.body.insertMessage;
    const sqlInsert = "INSERT INTO messages(message, user_id, created_at) values(?, ?, ?)";
    const sqlInsertDest = "INSERT INTO destinations(user_id, message_id) values(?, ?)";
    db.query(sqlInsert, [insertMessage, authId, new Date()], (err, result) => {
        if (err) console.log(err);
        db.query(sqlInsertDest, [userIdClick, result.insertId], (err, result) =>{
            if (err) console.log(err);
            res.send(result);
        })
    })
})

app.post('/api/insert/user', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const emailExist = "SELECT count(id) as count FROM users WHERE email=?";
    db.query(emailExist, email, (err, result) => {
        if (err) console.log(err);
        if (result[0].count) {
            const data = {
                save: false,
                result: result
            }
            res.send(data);
        }
        else
            bcrypt.hash(password, 10).then(hash => addUser(res, name, email, hash)).catch(err => console.log(err));     
    })
})

app.post('/api/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const slqSelect = "SELECT * FROM users WHERE email=?";
    db.query(slqSelect, email, (err, result) => {
        if (err) console.log(err);
        if (result.length) {
            const hash = result[0].password;
            bcrypt.compare(password, hash).then(isAuth => { 
                const data = {
                    isAuth : isAuth,
                    id : result[0].id
                }
                return res.send(data);
            }
            ).catch(err => console.log(err));
        }
        else {
            const data = {
                isAuth: "Email introuvable",
                id : null
            }
            return res.send(data);
        }
    });
})

function addUser(res, name, email, hash) {
    const sqlInsert = "INSERT INTO users(name, email, password) VALUES(?, ?, ?)";
    db.query(sqlInsert, [name, email, hash], (err, result) => {
        if (err) console.log(err);
        const data = {
            save: true,
            result: result
        }
        res.send(data);
    })
}

app.listen(process.env.PORT || 5000)