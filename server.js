var http = require('http');
var express = require("express");
var RED = require("node-red");
const socketIO = require('socket.io');
var embeddedStart = require('node-red-embedded-start');
var cors = require('cors');
require('events').EventEmitter.defaultMaxListeners = 15;

embeddedStart.inject(RED);

// Create an Express app

var app = express();
// Add a simple route for static content served from 'public'
// app.use("/",express.static("public"));
app.use(cors());

// Create a server
var server = http.createServer(app);

// #region
// app.use("/send_input", (req, res)=>{
//     try {
//       var query = req.query;
//       if(query){
//         var nodeId = query.nodeId;
//         var node_to_execute = nodeRed.getNode(nodeId);
//         if(node_to_execute){
//           node_to_execute.send(JSON.parse(query.data));
//           res.status(200).json({"expected":true,"response": "Node executed"});
//         }else{
//           res.status(201).json({"expected":false,"response": "Node wasn't executed"});
//         }
//       }else{
//         res.status(201).json({"expected":false,"response": "There weren't query to execute"});
//       }
//     }
//     catch(err) {
//       res.status(201).json({"expected":false,"response": "Error ::" + err});
//     }

//   }); 

// app.get("/get_node_properties", (req, res) => {
//     try {
//       var query = req.query;
//       if(query){
//         var nodeId = query.nodeId;
//         var node_to_execute = nodeRed.getNode(nodeId);
//         if(node_to_execute){
//           res.status(200).json({"expected":true,"response": node_to_execute});
//         }else{
//           res.status(201).json({"expected":false,"response": "Node wasn't executed"});
//         }
//       }
//     }
//     catch(err) {
//       res.status(201).json({"expected":false,"response": "Error ::" + err});
//     }
//   });
//#endregion
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
    //Start to listen all input nodes.
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