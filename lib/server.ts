import http from 'http';
import https from 'https';
import { URL } from 'url';
import { EventEmitter } from 'events';
import { serializeFault, serializeMethodResponse } from './serializer';
import Deserializer from './deserializer';

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
export default class Server extends EventEmitter {
  httpServer: http.Server | https.Server;
  close: (callback: any) => void;
  _options: {
    host?: string | undefined | null;
    path?: string | undefined | null;
    port?: number | undefined;
    url?: string | undefined;
  } = {};

  constructor(
    options: { host: string; port: number } | string,
    isSecure: boolean,
    onListening?: { (): void; (): void }
  ) {
    super();
    onListening = onListening || function () {};

    const that = this;

    // If a string URI is passed in, converts to URI fields
    if (typeof options === 'string') {
      const serverURL = new URL(options);
      this._options.host = serverURL.hostname;
      this._options.path = serverURL.pathname;
    }

    function handleMethodCall(
      request: any,
      response: {
        writeHead: (arg0: number, arg1: { 'Content-Type': string } | undefined) => void;
        end: (arg0: string | undefined) => void;
      }
    ) {
      const deserializer = new Deserializer();
      dedeserializeMethodCall(request, (error: any, methodName: PropertyKey, params: any) => {
        if (Object.prototype.hasOwnProperty.call(that._events, methodName)) {
          that.emit(methodName, null, params, (error: null, value: any) => {
            let xml = null;
            if (error !== null) {
              xml = serializeFault(error);
            } else {
              xml = serializeMethodResponse(value);
            }
            response.writeHead(200, { 'Content-Type': 'text/xml' });
            response.end(xml);
          });
        } else {
          that.emit('NotFound', methodName, params);
          response.writeHead(404);
          response.end();
        }
      });
    }

    this.httpServer = isSecure ? https.createServer(options, handleMethodCall) : http.createServer(handleMethodCall);

    process.nextTick(() => {
      this.httpServer.listen(options.port, options.host, onListening);
    });

    this.close = function (callback: any) {
      this.httpServer.once('close', callback);
      this.httpServer.close();
    }.bind(this);
  }
}
