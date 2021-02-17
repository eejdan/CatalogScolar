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
    waitForConnections: true,
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
app.get('/', async (req,res) => {
    var returned = false;
    let renderParams = {
        "parts": [
            {"name": "logbox", "dir":"enclosure/part/logbox", "styleDir": "logbox.css"}
        ]
    }
    if(!req.signedCookies.sid) {
        returned = true;
        return res.render('index', renderParams);
    }
    var valid=false;
    console.log('test1');
    sqlPool.getConnection((err, con) => {
        if(err) { return res.render('index', renderParams);  }
        validateSidSql = `SELECT * FROM session WHERE sid='${req.signedCookies.sid}'`;
        console.log('test1.3');
        con.query(validateSidSql, (err, result, fields) => {
            if(err) { returned = true; return res.render('index', renderParams);  }
            if(!result.length) {
                res.clearCookie('sid');
                console.log('test1.5');
                returned = true;
                return res.render('index', renderParams);
            }
            renderParams = {
                "parts": [
                    {"name": "elev", "dir":"enclosure/part/elev", "styleDir": "elev.css"}
                ]
            }
            console.log('test1.7');
            let date = new Date(result[0].last);
            return res.render('index', renderParams);
        })
        if(returned) { return; }
    })
})
//req.body.password //req.body.matricol
app.post('/login', (req,res) => {
    console.log(req.body.password);
    var returned = false;
    sqlPool.getConnection((err, con) => {
        if(err) throw console.log(err);
        var correctPass = false;
        getUserSql = `SELECT * FROM \`user\` WHERE numar_matricol='${req.body.matricol}'`;
        con.query(getUserSql,  (err, result, fields) => {
            if(err) throw err;
            if(result.length > 0) {
                if(result[0]) {
                    let phash = shaenc(req.body.password);
                    switch(phash) {
                        case result[0].password:
                            correctPass = true; break;
                        case result[0].p1_password:
                            correctPass = true; break;
                        case result[0].p2_password:
                            correctPass = true; break;
                    }
                }
            } 
            if(!correctPass) {
                returned = true;
                return res.redirect('/');
            }
            let cookie = '';
            {
                let alpha = 'abcdefg';
                for(let i = 0;i<16;i++) {
                    cookie += alpha[Math.floor(Math.random() * 7)];
                }
                cookie = shaenc(cookie);
            }
            let makeSessionSql = `INSERT INTO \`session\` (\`numar_matricol\`, \`sid\`) VALUES ('${req.body.matricol}', '${cookie}')`;
            con.query(makeSessionSql, async (err, result, fields) => {
                if(err) throw err;    
                await res.cookie('sid', cookie, { signed: true });
                return res.redirect('/');
            })
        })
        if(returned) {return;}
    })
})
//logout done
app.post('/logout', (req,res) => {
    res.clearCookie('sid');
    console.log('user logout '+ req.signedCookies.sid); 
    sqlPool.getConnection((err, con) => {
        if(err) throw console.log(err);
        con.query(`DELETE FROM session WHERE sid='${req.signedCookies.sid}'`, (err, result, fields) => {
            if(err) console.log(err);    
            res.redirect('/');
        })
    })
})
//FIX THIS
app.get('/elev/', (req,res) => {
    //validate cookie
    if(!req.signedCookies.sid) {
        returned = true;
        return res.render('index', renderParams);
    }
    renderParams = {
        "parts": [
            {"name": "elev", "dir":"enclosure/part/elev", "styleDir": "elev.css"}
        ]
    }
    sqlPool.getConnection((err, con) => { 

    })
}) 

app.listen(3030);

//make signer

//make init

/*{ 
    //delete sessions
    let unclosedSessions
    console.log("Keeping failed")
}
function logFailsafe() {

}
*/
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