/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
var messages = [{username: 'anonymous', text: ';asdkjfaldj'}];
var rooms = ['Lobby'];


var getRoot = function(request, response) {
  response.write(JSON.stringify('hello'))
};
var getMessages = function(request, response){
  response.write(JSON.stringify({'results': messages}));
};
var postMessage = function(request, response){
  var str = '';
  request.on('data', function(chunk) {
    str += chunk;
  });
  request.on('end', function() {
    messages.push(JSON.parse(str));
  });
  response.write(JSON.stringify('success'));
};
var getRooms = function(request, response){
  response.write(JSON.stringify({'results': rooms}));
};
var postRoom = function(request, response){
  var str = '';
  request.on('data', function(chunk) {
    str += chunk;
  });
  request.on('end', function() {
    rooms.push(JSON.parse(str));
  });
  response.write(JSON.stringify('success'));
};
var router = {
  "/": {
    'GET': getRoot
  },
  "/classes/messages": {
    "GET": getMessages,
    "POST": postMessage
  },
  "/classes/rooms": {
    "GET": getRooms,
    "POST": postRoom
  }
};

module.exports = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  var statusCode;
  var headers = defaultCorsHeaders;
  headers['Content-Type'] = "application/json";

  if (!router[request.url]) {
    statusCode = 400;
    response.writeHead(statusCode, headers);
  } else if (request.method === 'OPTIONS') {
    statusCode = 200;
    headers['Allow'] = defaultCorsHeaders["access-control-allow-methods"];
    response.writeHead(statusCode, headers);
  } else {

    statusCode = 200;
    response.writeHead(statusCode, headers);

    // route urls to actions
    console.log("Serving request type " + request.method + " for url " + request.url);
    router[request.url][request.method](request, response);
  }

  response.end();


  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  // console.log(request.data);

  // var responseData;

  // The outgoing status.

  // See the note below about CORS headers.

  // Tell the client we are sending them plain text.
  //
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.

  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.

  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.

  // if(request.method === 'POST'){
  //   // console.log(request);
  //   var str = '';
  //   request.on('data', function(chunk) {
  //     str += chunk;
  //   });
  //   request.on('end', function() {
  //     data.push(JSON.parse(str));
  //     headers['Content-Type'] = "text/plain";
  //     response.writeHead(201, headers);
  //     response.end('success!');
  //   });
  //   // responseData = 'success!';
  // }else if(request.method === 'GET'){
  //   responseData = JSON.stringify({'results': data});
  //   response.end(responseData);
  // }else if (request.method === 'OPTIONS') {
  //   headers['Allow'] = defaultCorsHeaders["access-control-allow-methods"];
  //   response.end(responseData);
  // }

  // console.log(responseData);
};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

