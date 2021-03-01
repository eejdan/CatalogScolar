//Daniel Birleanu 2021 Copyright. All rights reserved.
console.log('Daniel Birleanu 2021 Copyright. All rights reserved.');
require('dotenv').config();

const bodyParser = require('body-parser');
const express = require("express");
const hash = require('hash.js');
var mysql = require('mysql');

var app = express();
var sqlPool = mysql.createPool({
    waitForConnections: true,
    connectionLimit : 10,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// '/' api status
app.get('/', (req,res) => {
    res.send(100)
})
app.post('/logout', (req, res) => {
    res.clearCookie('sid');
    console.log('user logout '+ req.signedCookies.sid); 
    sqlPool.getConnection((err, con) => {
        if(err) return console.log(err);
        con.query(`DELETE FROM session WHERE sid='${req.signedCookies.sid}'`, (err, result, fields) => {
            if(err) return console.log(err);    
            res.redirect('/');
        })
    })
})

app.post('/login', (req, res) => {

})



app.listen(3999, () => { console.log("Server API Pornit."); })