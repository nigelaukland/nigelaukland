var express         = require("express");
var path            = require("path");
var config          = require("./config.js");
var http            = require('http');
var https           = require('https');
var fs              = require('fs');
var morgan          = require('morgan');
var bodyParser      = require("body-parser");
var app             = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); 

/*
// Global declaration of the Couchbase server and bucket to be used, and message on connect
module.exports.bucket = (new couchbase.Cluster(config.couchbase.server)).openBucket(config.couchbase.cheeseBucket);
app.use(express.static(path.join(__dirname, "public")));
module.exports.bucket.on('connect', function() {
    console.log('Connected to cheeseBucket')
});
*/

// logging
app.use(morgan('dev'))

// This part added to ensure secure traffic only
if (config.connection.secureOnly == 'yes') {
    app.all('*', function(req, res, next) {
        console.log('secure request?: ', req.secure, 'hostname: ', req.hostname, req.url);
        if (req.secure) {
            return next();
        }
        console.log('redirecting insecure request through https');
        res.redirect('https://'+req.hostname+':'+app.get('secPort')+req.url);
    });
}

// Set up http and https

// set the app environment
app.set('port', config.connection.port);
app.set('secPort', config.connection.secPort);

/**
 * Create HTTP server.
 * 'server' is an instance of http.Server
 */
var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 * Setup event listeners
 */
server.listen(app.get('port'), function() {
   console.log('http server listening on port ', app.get('port'));
});
server.on('clientError', onError);
server.on('listening', onListening);

/**
 * Create HTTPS server with self signed key and certificate
 */
var options = {
    key: fs.readFileSync(__dirname+config.connection.key),
    cert: fs.readFileSync(__dirname+config.connection.cert)
};

var secureServer = https.createServer(options, app);

/**
 * Listen on secure port, on all network interfaces.
 * Setup event listeners
 */

secureServer.listen(app.get('secPort'), function() {
   console.log('https server listening on port ',app.get('secPort'));
});
secureServer.on('error', onError);
secureServer.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
}