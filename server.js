const express = require('express');
const con = require('./config/mySql');
const path = require('path');
var bodyParser = require('body-parser');
var app = require('express')();
const cors = require('cors');
const fs = require('fs');

var http = require('http').createServer(app);

app.use(cors({
    origin: '*'
}));

// Connect Database
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

// Init Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// Define Routes

app.use('/api/collectionInfo', require('./routes/api/collectionInfo'));

http.listen(5000, ()=> {
     console.log('listening on *:5000');
});