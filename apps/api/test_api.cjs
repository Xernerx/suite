const http = require('http');
fetch('http://localhost:3000/api/secure/bots/881678826906730547/stats')
	.then((r) => r.json())
	.then(console.log)
	.catch(console.error);
