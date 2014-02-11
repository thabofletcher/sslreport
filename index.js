var express = require('express');
var app = express();
var report_handler = require('./report.js');

app.use('/', express.static(__dirname + '/static'))
//app.get('/report/:reportid', report_handler.get) 
app.post('/report/', report_handler.post)

app.listen(5150);