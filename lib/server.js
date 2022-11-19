"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const url_1 = require("url");
const events_1 = require("events");
const serializer_1 = require("./serializer");
const deserializer_1 = __importDefault(require("./deserializer"));
// function Server(options: string | url.UrlWithStringQuery | https.ServerOptions<typeof http.IncomingMessage, typeof http.ServerResponse>, isSecure: boolean, onListening: { (): void; (): void; } | undefined) {
//   if (this instanceof Server === false) {
//     return new Server(options, isSecure);
//   }
//   onListening = onListening || function () {};
//   const that = this;
//   // If a string URI is passed in, converts to URI fields
//   if (typeof options === 'string') {
//     options = url.parse(options);
//     options.host = options.hostname;
//     options.path = options.pathname;
//   }
//   function handleMethodCall(request: any, response: { writeHead: (arg0: number, arg1: { 'Content-Type': string; } | undefined) => void; end: (arg0: string | undefined) => void; }) {
//     const deserializer = new Deserializer();
//     dedeserializeMethodCall(request, (error: any, methodName: PropertyKey, params: any) => {
//       if (Object.prototype.hasOwnProperty.call(that._events, methodName)) {
//         that.emit(methodName, null, params, (error: null, value: any) => {
//           let xml = null;
//           if (error !== null) {
//             xml = serializeFault(error);
//           } else {
//             xml = serializeMethodResponse(value);
//           }
//           response.writeHead(200, { 'Content-Type': 'text/xml' });
//           response.end(xml);
//         });
//       } else {
//         that.emit('NotFound', methodName, params);
//         response.writeHead(404);
//         response.end();
//       }
//     });
//   }
//   this.httpServer = isSecure ? https.createServer(options, handleMethodCall) : http.createServer(handleMethodCall);
//   process.nextTick(() => {
//     this.httpServer.listen(options.port, options.host, onListening);
//   });
//   this.close = function (callback: any) {
//     this.httpServer.once('close', callback);
//     this.httpServer.close();
//   }.bind(this);
// }
// // Inherit from EventEmitter to emit and listen
// Server.prototype.__proto__ = EventEmitter.prototype;
/**
 * Creates a new Server object. Also creates an HTTP server to start listening
 * for XML-RPC method calls. Will emit an event with the XML-RPC call's method
 * name when receiving a method call.
 *
 * @param {Object|String} options - The HTTP server options. Either a URI string (e.g. 'http://localhost:9090') or an object with fields:
 *   - {String} host              - (optional)
 *   - {Number} port
 * @param {Boolean} isSecure      - True if using https for making calls, otherwise false.
 */
class Server extends events_1.EventEmitter {
    httpServer;
    close;
    _options = {};
    constructor(options, isSecure, onListening) {
        super();
        onListening = onListening || function () { };
        const that = this;
        // If a string URI is passed in, converts to URI fields
        if (typeof options === 'string') {
            const serverURL = new url_1.URL(options);
            this._options.host = serverURL.hostname;
            this._options.path = serverURL.pathname;
        }
        function handleMethodCall(request, response) {
            const deserializer = new deserializer_1.default();
            dedeserializeMethodCall(request, (error, methodName, params) => {
                if (Object.prototype.hasOwnProperty.call(that._events, methodName)) {
                    that.emit(methodName, null, params, (error, value) => {
                        let xml = null;
                        if (error !== null) {
                            xml = (0, serializer_1.serializeFault)(error);
                        }
                        else {
                            xml = (0, serializer_1.serializeMethodResponse)(value);
                        }
                        response.writeHead(200, { 'Content-Type': 'text/xml' });
                        response.end(xml);
                    });
                }
                else {
                    that.emit('NotFound', methodName, params);
                    response.writeHead(404);
                    response.end();
                }
            });
        }
        this.httpServer = isSecure ? https_1.default.createServer(options, handleMethodCall) : http_1.default.createServer(handleMethodCall);
        process.nextTick(() => {
            this.httpServer.listen(options.port, options.host, onListening);
        });
        this.close = function (callback) {
            this.httpServer.once('close', callback);
            this.httpServer.close();
        }.bind(this);
    }
}
exports.default = Server;
