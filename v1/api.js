//Daniel Birleanu 2021 Copyright. All rights reserved.
console.log('Daniel Birleanu 2021 Copyright. All rights reserved.');
require('dotenv').config();

const bodyParser = require('body-parser');
const express = require("express");
const hash = require('hash.js');
var mysql = require('mysql');

var app = express();

// '/' api status
app.get('/', (req,res) => {
    
})

app.listen(3999, () => { console.log("Server Pornit."); })