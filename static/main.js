document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('gobutton').addEventListener('click', function() {
		var request = new XMLHttpRequest()

		request.open('POST', '/report/', true)

		request.onload = function() {
		  if (request.status == 200)
		    alert('twerking it!')
		  else console.log("server unexpected response: " + request.status + ", " + request.responseText)
		}

		request.onerror = function(evt) {
			console.log("failed to make request: " + evt)
		}

		request.send()
	})
})