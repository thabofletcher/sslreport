document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('gobutton').addEventListener('click', function() {
		var request = new XMLHttpRequest()

		request.open('POST', '/report/', true)

		request.onload = function() {
		  if (request.status == 200)
		    location.hash = request.responseText
		  else console.log("server unexpected response: " + request.status + ", " + request.responseText)
		}

		request.onerror = function(evt) {
			console.log("failed to make request: " + evt)
		}

		request.send()
	})

	var fb = new Firebase('https://sslreport.firebaseio.com/');

	fb.on('child_added', function(childFb) {
		// <tr>
		// <th>Report Time</th>
		// <th>Report ID</th>
		// <th>Percent Vulnerable to MITM</th>
		// </tr>
		var child = childFb.val()
		var table = document.getElementById("allresults");
		var row = table.insertRow(1);

		row.innerHTML = 
		'<th>' + child.date + '</th>' + 
		'<th><a href=#' + child.id + '>' + child.id + '</a></th>' + 
		'<th id="' + child.id + 'MITM">' + getMITM(child.counts) + '</th>' + 
		'<th id="' + child.id + 'Q">' + getQ(child.counts) + '</th>'
	})

	fb.on('child_changed', function(childFb) {
		var child = childFb.val()
		document.getElementById(child.id + "MITM").innerHTML = getMITM(child.counts)
		document.getElementById(child.id + "Q").innerHTML = getQ(child.counts)
	})

	if (location.hash)
		loadchart()
	else
		document.getElementById('charttop').style.display = "none"
})

var getMITM = function(counts) {
	if (counts.http + counts.https == 0) return '-'
	return parseFloat(counts.http / (counts.http + counts.https) * 100).toPrecision(4) + '%'
}

var getQ = function(counts) {
	return parseFloat((counts.ok + counts.error) / 5).toPrecision(4) + '%'
}

var data = []
//var reload = false;

var loadchart = function() {
	var fb = new Firebase('https://sslreport.firebaseio.com/' + location.hash.substr(1) + "/counts");
	fb.on('value', function(childFb) {
		var child = childFb.val()
		if (child) {
			data = []
			data.push({value: child.https, color:"#029acf"})
			data.push({value: child.http, color:"#469408"})
			data.push({value: child.error, color:"#d9230f"})
			data.push({value: 500 - (child.ok + child.error), color:"#474949"})

			refreshchart()	
		}
	})
}

var refreshchart = function() {
	document.getElementById('chartholder').innerHTML = '<canvas id="chart" width="400" height="400"></canvas>'
	var ctx = document.getElementById('chart').getContext('2d');
	var chart = new Chart(ctx).Doughnut(data, {animation:false});
	document.getElementById('charttop').style.display = "block"
}

window.addEventListener('hashchange', loadchart, false)