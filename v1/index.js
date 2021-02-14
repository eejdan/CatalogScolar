//Daniel Birleanu 2021 Copyright. All rights reserved.
console.log('Daniel Birleanu 2021 Copyright. All rights reserved.');
require('dotenv').config();

const express = require("express");
const hash = require('hash.js')
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const { render } = require("ejs");

var mysql = require('mysql')

var app = express();
var con = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
})

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

app.use(express.static('public'))
app.use(cookieParser(process.env.COOKIESECRET))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
// do the login and db stuff
g_renderParams = { 
    "parts": [
        {"name": "header","dir":"enclosure/part/header","styleDir": "css/header.css"},
        {"name": "footer","dir":"enclosure/part/footer","styleDir": "css/footer.css"}//
    ]
}
//TBD keep queries as string variables
renderLogin = () => {
    let renderParams = {
        "parts": [
            {"name": "logbox", "dir":"enclosure/part/logbox", "styleDir": "css/logbox.css"}
        ]
    }
    let final_renderParams = {
        "parts": g_renderParams.parts.concat(renderParams.parts)
    }
    res.render('index', final_renderParams)
}
//make logout delete sid
// will use sid token for session id
app.get('/', (req,res) => {
    if(!req.signedCookies) {
        renderLogin
        return;
    }
    con.connect((err) => {
        if(err) throw err;
        con.query(`SELECT * FROM session WHERE sid=\`${req.signedCookies.sid}\``, (err, result, fields) => {
            if(err) throw err;
            if(!result[0].numar_matricol) {
                renderLogin
                return;
            }
            if(result[0].last) {
                con.query(`UPDATE session SET last = CURRENT_TIMESTAMP WHERE sid=\`${req.signedCookies.sid}\``, (err, result, fields) => {
                    if(err) throw err;
                })
            } else {
                renderLogin
                return;
            }
        })
    })
    var renderParams = {
        "parts": [
            
        ]
    } 
    var final_renderParams = {
        "parts": g_renderParams.parts.concat(renderParams.parts)
    }
    res.render('index', final_renderParams)
})
//req.body.password //req.body.username
app.post('/login', (req,res) => {
    //build db user
    //check if returned empty set
    hashedPassword = hash.sha256().update(req.body.password).digest('hex');
    

})
app.post('/logout', (req,res) => {
    con.connect((err) => {
        if(err) throw err;
        con.query(`DELETE * FROM session WHERE sid=\`${req.signedCookies.sid}\``, (err, result, fields) => {
            if(err) throw err;    
        })
    })
    renderLogin
})
//FIX THIS
app.get('/elev/', (req,res) => {
    //validate sid 
    //TBD build up data
    udata = {}
    res.json(udata)
}) 

//make signer

//make init

{ 
    //delete sessions
    let unclosedSessions
    console.log("Keeping failed")
}
function logFailsafe() {

}


app.listen(3030);
logErrVault = [];
//keep in memory and retry later
//
function logFailsafe(type) {
    logErrVault[logErrVault.length] = { 
        "type": type,
        "context": context
    };
}