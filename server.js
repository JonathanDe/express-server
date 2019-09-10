var http = require('http');
var express = require("express");
var RED = require("node-red");
const socketIO = require('socket.io');
var embeddedStart = require('node-red-embedded-start');
var cors = require('cors');
var bodyParser = require('body-parser')

embeddedStart.inject(RED);

// Create an Express app

function boot() {
  var app = express();
  
  app.use(cors());
  app.use(bodyParser.urlencoded({limit: '10mb', extended: false}))
  
  // Create a server
  var server = http.createServer(app);
  
  const io = socketIO(server);
  const conn = io.on('connection', (socket) => {
      return socket;
  });
  
  io.on('connection', (socket) => {
    console.log('alguien se conectó', socket.id);
  });
  
  // Create the settings object - see default settings.js file for other options
  var settings = {
      httpAdminRoot:"/red",
      httpNodeRoot: "/",
      userDir: "/Users/lciro/.node-red",
      functionGlobalContext: { }    // enables global context
  };
  
  // Initialise the runtime with a server and settings
  RED.init(server,settings);
  
  // Serve the editor UI from /red
  app.use(settings.httpAdminRoot,RED.httpAdmin);
  
  // Serve the http nodes UI from /api
  app.use(settings.httpNodeRoot,RED.httpNode);
  
  server.listen(8000);
  
  // Start the runtime
  let nodeRed = null;
  
  RED.start().then((result) => {
      nodeRed = RED.nodes;
      //Start to listen all input nodes
      nodeRed.eachNode(function getNodes(nodeI){
        const node = nodeRed.getNode(nodeI.id);      
        if(node){       
          node.on('input', function(msg) {
            conn.emit(nodeI.id, {
              msg: msg,
              node: nodeI
            });
          });
        }
      }); 
      
    }).catch((err) => {
      console.log("RED.start() ERROR ::: ", err);
    });
}

boot();