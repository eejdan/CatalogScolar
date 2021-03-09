//Daniel Birleanu 2021 Copyright. All rights reserved.
console.log('Daniel Birleanu 2021 OpenSource. All rights reserved.');
require('dotenv').config();

init();

const express = require("express");
const hash = require('hash.js');
const cookieParser = require("cookie-parser");
var mysql = require('mysql')
var proxy = require('express-http-proxy');
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


{
    let proxyIp = 'localhost:' + process.env.APIPORT;
    app.use('/api', proxy(proxyIp));
}
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static('public'))

app.use(cookieParser(process.env.COOKIESECRET))

const apiForwardOptions = {
    host: 'localhost',
    port: process.env.APIPORT,
}
var renderLogin = {
    "parts": [
        {"name": "logbox", "dir":"enclosure/part/logbox", "styleDir": "logbox.css"}
    ]
}

app.get('/', async (req,res) => {
    if(!req.signedCookies.sid) {
        return res.render('index', renderParams);
    }
    var renderParams = {
        "parts": [
            {
                "name": "logbox", 
                "dir":"enclosure/part/logbox", 
                "styleDir": 
                "logbox.css"
            }
        ]
    }
    sqlPool.getConnection((err, con) => {
        if(err) { return res.render('index', renderParams);  }
        validateSidSql = `SELECT * FROM session WHERE sid='${req.signedCookies.sid}'`;
        con.query(validateSidSql, (err, result, fields) => {
            if(err) { return res.render('index', renderParams);  }
            if(!result.length) {
                res.clearCookie('sid');
                return res.render('index', renderParams);
            }
            renderParams.parts= [
                {
                    "name": "elev",
                    "dir":"enclosure/part/elev", 
                    "styleDir": "elev.css"
                }
            ]
            return res.render('index', renderParams);
        })
    })
})

//FIX THIS
app.post('/elev/', (req,res) => { //neterminat //de aici se preiau in forma JSON informatiile despre elev, note, absente
    if(!req.signedCookies.sid) {
        return res.send(401);
    }
    let build = {}
    sqlPool.getConnection((err, con) => {
        if(err) return console.log(err);
        let validateSidSql = `SELECT * FROM session WHERE sid='${req.signedCookies.sid}'`;
        con.query(validateSidSql, (err, result, fields) => {
            if(err) { console.log(err); return res.send(500)  }
            if(!result.length) {
                res.clearCookie(404)    
                return res.send(404);
            }
            refreshSid(req.signedCookies.sid);
            let build = {
                "materii": []
            }
            let matricol = result[0].numar_matricol;
            let getElevInfoSql = `SELECT nume,prenume,clasa FROM \`elev\` WHERE numar_matricol='${matricol}'`;
            con.query(getElevInfoSql, (err, result, fields) => {
                if(err) { console.log(err); return res.send(500); }
                let getElevClasaSql = `SELECT * FROM \`clasa\` WHERE clasa='${result[0].clasa}'`;
                con.query(getElevClasaSql, (err, result, fields) => {
                    if(err) { console.log(err);  return res.send(500); }
                    if(!result.length) { return res.send(400); }
                    result.forEach((sres) => {
                        build.materii[sres.materie]={"nume": sres.materie, "profesor": sres.profesor, "note": [], "abs": []}
                    })
                    let getElevNotaSql = `SELECT * FROM \`nota\` WHERE numar_matricol=${matricol}`;
                    con.query(getElevNotaSql, (err, result, field) => {
                        if(err) { console.log(err); return res.send(500); }
                        if(!result.length) {
                            return res.send(build)
                        }
                        result.forEach((sres)=> {
                            build.materii[sres.disciplina].note[build.materii[sres.disciplina].note.length]={"nota": sres.nota, "data": sres.data }
                        })
                        let getElevAbsentaSql = `SELECT * FROM \`absenta\` WHERE numar_matricol=${matricol}`;
                        con.query(getElevAbsentaSql, (err, result, fields) => {
                            if(err) { console.log(err); return res.send(500); }
                            if(!result.length) {
                                return res.send(build)
                            }
                            result.forEach((sres) => {
                                build.materii[sres.disciplina].abs[build.materii[sres.disciplina].abs.length] = {"materie": sres.disciplina, "data": sres.data};
                            })
                            return res.send(build);
                        })
                    })
                })
            })
        })
    })
}) 

// De facut: Interfata profesor si administrator sistem

app.listen(process.env.WEBPORT, () => { console.log("Web server pornit.")});

function init() {}

function shaenc(str) {
    return hash.sha256().update(str).digest('hex');
}

function buildDbDate(a) {
    let basicDate = new Date();
    let mth = basicDate.getMonth()+1;
    if(mth<10) {
        mth = '0'+mth; 
    }
    let strDate = `${basicDate.getFullYear()}-${mth}-${basicDate.getDate()}`;
    return strDate;
}

/* Notes:
Dates are managed by the web server.
Database dates are: YYYY-MM-DD
Absente si note : MM-DD

TBD tabs for elev and cadru didactic login
*/