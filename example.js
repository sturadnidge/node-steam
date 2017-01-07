'use strict';
/* npm install brackify readline-sync */

var crypto = require('crypto'),
    fs     = require('fs'),
    rls    = require('readline-sync'),
    Steam  = require('./index.js'),
    wrap   = require('brackify');

var argv = require('yargs')
  .usage('Usage: $0 -u <username> -s /path/to/sentry.file [--debug]')
  .demand(['s', 'u'])
  .boolean('debug')
  .alias('s', 'sentry')
  .alias('u', 'username')
  .describe('u', 'a Steam user name, NOT a Steam ID.')
  .describe('s', 'a working Steam sentry file.')
  .argv;

var debug = argv.debug,
    logonData = {},
    sentryFile = argv.s;

logonData.account_name = argv.u;
logonData.password = rls.question('enter steam password: ', {noEchoBack: true});

if (debug) console.log('looking for sentry file ' + sentryFile);

if (fs.existsSync(sentryFile)) {
  var sentry = fs.readFileSync(sentryFile);
  logonData.sha_sentryfile = makeSha(sentry);
} else {
  console.log('sentry file ' + wrap(sentryFile) + ' not found, required for this script');
  process.exit();
}

//
// external modules
//
var SteamUser = require('../node-steam-user');

//
// main
//

var client = new Steam.SteamClient();

var steamUser = new SteamUser(client);

client.connect();

client.on('connected', function() {
  if (debug) console.log('got connection, attempting log on');
  // logOn provided by node-steam-user module
  steamUser.logOn(logonData);
});

client.on('error', function(error) {
  console.log('unhandled error, dying');
  throw error;
});

// User related events are emitted by node-steam-user module
steamUser.on('loggedOn', function(response) {
  if (debug) console.log('in logOn handler');

  console.log('Logged on with Steam ID: ' + response.client_supplied_steamid.toString());
});

// User related events are emitted by node-steam-user module
steamUser.on('logOnError', function(response) {
  if (debug) console.log('in log on error handler');

  client.disconnect();

  var prefix = "log on failed due to ";

  switch (response.eresult.toString()) {

    case '5':
      console.log(prefix + 'invalid password ' + wrap(response.eresult.toString()));
      process.exit();
      break;

    case '18':
      console.log(prefix + 'invalid username ' + wrap(response.eresult.toString()));
      process.exit();
      break;

    default:
      console.log('Login error, eresult ID: ' + response.eresult.toString());
      // see https://github.com/SteamRE/SteamKit/blob/master/Resources/SteamLanguage/eresult.steamd
      process.exit();
  }

});

client.on('servers', function(servers) {
  console.log('got latest server list');
});

// helpers

function makeSha(bytes) {
  var hash = crypto.createHash('sha1');
  hash.update(bytes);
  return hash.digest();
}
