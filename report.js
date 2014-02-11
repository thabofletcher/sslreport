var mrequest = require('request')
var http = require('http')
var random_ua = require('random-ua')
var url = require('url')

var firebase = require('firebase')

var firebasepath = {
    base_path: "https://sslreport.firebaseio.com/",
    auth: "mwIybs5UQeywYYSopO1i67Lq3MMWLUnfQkrf0ATa"
}

exports.post = function (request, response) {
	response.writeHead(200)
	response.end()
}

var twerkit = function  (request, response) {
	var ua = random_ua.generate()
	var count = 0

	var totalHttps = 0
	var totalHttp = 0

	var respond = function(obj) {
		obj.http = totalHttp
		obj.https = totalHttps
		count++
		obj.count = count

		response.write(JSON.stringify(obj, null, "\t") + ',\n')

		// should have a response for every line except the headers
		if (count == 500) {
			end()
		}
	}

	var start = function() {
		response.setHeader("Content-Type", "application/json")
		response.writeHead(200)
		response.write("[")
	}
	var end = function() { 
		response.write("]")
		response.end() 
	}

	var query = function(uri, orig) {
		if (!orig) orig = uri
		mrequest({ 
			uri: uri,
			followRedirect: false, 
			headers: {
        		'User-Agent': ua
        	} 
        }, function (error, response, body) {
			if (error) {
				if (error.syscall && error.syscall == 'getaddrinfo' && uri.indexOf('http://www.') == -1) {
					var newuri = uri.replace('http://', 'http://www.')
					query(newuri, orig)
				}
				else
					respond({orig: orig, uri: uri, error: error})
			}
			else if (response) {

				if (response.statusCode == 200) {
					totalHttp++
					respond({orig: orig, uri: uri, status: response.statusCode})
				}
				else if (response.statusCode > 300 && response.statusCode < 400) {
					if (!response.headers.location)
						respond({orig: orig, uri: uri, code: response.statusCode, target: null})
					else if (response.headers.location.indexOf('https') != -1) {
						totalHttps++
						respond({orig: orig, uri: uri, code: response.statusCode, target: response.headers.location})
					}
					else {
						if (url.parse(response.headers.location).hostname)
							query(response.headers.location, orig)
						else 
							query('http://' + url.parse(uri).hostname + response.headers.location, orig)
					}
						
				}
				else 
					respond({orig: orig, uri: uri, code: response.statusCode})
			}
			else {
				respond({orig: orig, uri: uri, wtf: response})
			}
		})		
	}

	var queryAll = function() {
		mrequest('http://moz.com/top500/domains/csv', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var lines = body.split('\n')
				count = 0;
				start()
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
				start()
				respond({error: error, response: response})
				end()
			}
		})	
	}()
}