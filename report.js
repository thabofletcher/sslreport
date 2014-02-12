var mrequest = require('request')
var http = require('http')
var random_ua = require('random-ua')
var uuid = require('uuid');
var url = require('url')

var firebase = require('firebase')
var fb = new firebase("https://sslreport.firebaseio.com/")
fb.auth("mwIybs5UQeywYYSopO1i67Lq3MMWLUnfQkrf0ATa")

exports.post = function (request, response) {
	var now = new Date()
	var results = {
		id: now.getTime() + '-' + uuid.v1(),
		date: now.toString(),
		counts: {
			ok: 0,
			error: 0,
			http: 0,
			https: 0		
		},
		useragent: random_ua.generate(),
		responses: []
	}

	response.writeHead(200)
	response.write(results.id)
	response.end()

	fb.child(results.id).set(results)

	var append = function(obj) {
		results.responses.push(obj)
		fb.child(results.id).set(results)
	}

	var addhttps = function(obj) {
		results.counts.ok++
		results.counts.https++
		append(obj)
	}

	var addhttp = function(obj) {
		results.counts.ok++
		results.counts.http++
		append(obj)
	}

	var adderror = function(obj) {
		results.counts.error++
		append(obj)
	}

	var query = function(uri, orig) {
		if (!orig) orig = uri
		mrequest({ 
			uri: uri,
			followRedirect: false, 
			headers: {
        		'User-Agent': results.useragent
        	} 
        }, function (error, response, body) {
			if (error) {
				if (error.syscall && error.syscall == 'getaddrinfo' && uri.indexOf('http://www.') == -1) {
					var newuri = uri.replace('http://', 'http://www.')
					query(newuri, orig)
				}
				else
					adderror({orig: orig, uri: uri, error: error})
			}
			else if (response) {

				if (response.statusCode == 200) {
					addhttp({orig: orig, uri: uri, status: response.statusCode})
				}
				else if (response.statusCode > 300 && response.statusCode < 400) {
					if (!response.headers.location)
						adderror({orig: orig, uri: uri, code: response.statusCode, target: null})
					else if (response.headers.location.indexOf('https') != -1) {
						addhttps({orig: orig, uri: uri, code: response.statusCode, target: response.headers.location})
					}
					else {
						if (url.parse(response.headers.location).hostname)
							query(response.headers.location, orig)
						else 
							query('http://' + url.parse(uri).hostname + response.headers.location, orig)
					}
						
				}
				else 
					adderror({orig: orig, uri: uri, code: response.statusCode})
			}
			else {
				adderror({orig: orig, uri: uri, wtf: response})
			}
		})		
	}

	var queryAll = function() {
		mrequest('http://moz.com/top500/domains/csv', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var lines = body.split('\n')
				lines.forEach(function(line) {
					var fields = line.split(',')
					// headers dont have an index as the first field
					if (!isNaN(parseInt(fields[0]))) {
						var uri = 'http://' + fields[1].substr(1, fields[1].length-2)
						query(uri)
					}
				})

			}
			else {
				results.catastrophic = {error: error, response: response}
				fb.child(results.id).set(results)
			}
		})	
	}()
}