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
var sqlPool = mysql.createPool({
    connectionLimit : 10,
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
//TBD keep queries as string variables

// IMPORTANT: failsafe instead of throw
//make logout delete sid
// will use sid token for session id
app.get('/', (req,res) => {
    let renderParams = {
        "parts": [
            {"name": "logbox", "dir":"enclosure/part/logbox", "styleDir": "logbox.css"}
        ]
    }
    if(!req.signedCookies) {
        res.render('index', renderParams);
        return;
    }
    sqlPool.getConnection((err, con) => {
        if(err) throw err;
        var user;
        con.query(`SELECT * FROM session WHERE sid='${req.signedCookies.sid}'`, (err, result, fields) => {
            if(err) throw err;
            if(!result.length) {
                res.render('index', renderParams);
                return;
            }
            console.log(new Date(result[0].last))
        })
    })
    console.log(new Date('1-01-1999'));
    res.render('index', renderParams);
})
//req.body.password //req.body.matricol
app.post('/login', (req,res) => {
    getUserSql = `SELECT * FROM \`user\` WHERE numar_matricol=\`${req.body.matricol}\``;
    var correctPass = false;
    con.connect((err) => {
        if(err) throw err;
        con.query(getUserSql,  (err, result, fields) => {
            if(err) throw err;
            if(result.length > 0) {
                if(result[0]) {
                    hash = shaenc(req.body.password);
                    switch(hash) {
                        case result[0].password:
                            correctPass = true; break;
                        case result[0].p1_password:
                            correctPass = true; break;
                        case result[0].p2_password:
                            correctPass = true; break;
                    }
                }
            }
        })
    })
    if(!correctPass) {
        renderLogin
        return;
    }
    var alpha = 'abcdefg'
    var cookie = '';
    for(var i = 0;i<16;i++) {
        cookie += alpha[Math.floor(Math.random() * 7)];
    }
    cookie = shaenc(cookie);
    con.connect((err) => {
        if(err) throw err;
        makeSessionSql = `INSERT INTO \`session\` (\`numar_matricol\`, \`sid\`) VALUES ('${req.body.matricol}', '${cookie}', 'current_timestamp()')`;
        con.query(`DELETE * FROM session WHERE sid=\`${req.signedCookies.sid}\``, (err, result, fields) => {
            if(err) throw err;    
        })
    })
    res.cookie('sid', cookie, { signed: true });
    let renderParams = {
        "parts": [
            {"name": "elev", "dir":"enclosure/part/elev", "styleDir": "elev.css"}
        ]
    }
    let final_renderParams = {
        "parts": g_renderParams.parts.concat(renderParams.parts)
    }
    res.render('index', final_renderParams);

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
function shaenc(str) {
    return hash.sha256().update(str).digest('hex');
}