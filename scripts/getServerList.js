'use strict';

var fs = require('fs'),
		http = require('http');

var options = {
  hostname: 'api.steampowered.com',
  path: '/ISteamDirectory/GetCMList/v1/?format=json&cellid=0',
  method: 'GET'
};

var req = http.request(options, function(res) {

	var data = '';

	res.on('data', function(chunk) {
		data += chunk;
	});

	res.on('end', function() {
		var json = JSON.parse(data);

		if (!json.response || json.response.result != 1) {
			throw new Error('EJSONPARSE');
		}

		var servers = json.response.serverlist.map(function (server) {
			var parts = server.split(':');
			return {
				"host": parts[0],
				"port": parseInt(parts[1], 10)
			};
		});

		fs.writeFileSync(__dirname + '/../resources/servers.json', JSON.stringify(servers, null, "\t"));
	});

});

req.on('error', function(err) {
	console.log('failed getting updated server list, will use default');
});

req.end();
