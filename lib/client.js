"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const cookies_1 = __importDefault(require("./cookies"));
/**
 * Creates a Client object for making XML-RPC method calls.
 *
 * @constructor
 * @param {ClientOptions|URIString} options - Server options to make the HTTP request to.
 *                                  Either a URI string (e.g. 'http://localhost:9090') or an object with fields:
 *   - {String} host              - (optional)
 *   - {Number} port
 *   - {String} url               - (optional) - may be used instead of host/port pair
 *   - {Boolean} cookies          - (optional) - if true then cookies returned by server will be stored and sent back on the next calls.
 *                                  Also it will be possible to access/manipulate cookies via #setCookie/#getCookie methods
 * @param {Boolean} isSecure      - True if using https for making calls, otherwise false.
 * @return {Client}
 */
class Client {
    _options = { headers: {} };
    _isSecure;
    _cookies;
    headersProcessors = {
        processors: [],
        composeRequest: function (headers) {
            this.processors.forEach((p) => {
                p.composeRequest(headers);
            });
        },
        parseResponse: function (headers) {
            this.processors.forEach((p) => {
                p.parseResponse(headers);
            });
        }
    };
    constructor(options, isSecure) {
        const defaultHeaders = {
            'User-Agent': 'NodeJS XML-RPC Client',
            'Content-Type': 'text/xml',
            Accept: 'text/xml',
            'Accept-Charset': 'UTF8',
            Connection: 'Keep-Alive'
        };
        if (typeof options === 'string') {
            const clientURL = new url_1.URL(options);
            this._options.host = clientURL.hostname;
            this._options.path = clientURL.pathname;
        }
        else {
            const { url, cookies, headers, basic_auth, method } = options;
            if (url) {
                const clientURL = new url_1.URL(url);
                this._options.host = clientURL.hostname;
                this._options.path = clientURL.pathname;
                this._options.port = clientURL.port
                    ? parseInt(clientURL.port, 10)
                    : undefined;
            }
            if (headers)
                this._options.headers = headers || {};
            if (method)
                this._options.method = method ?? 'POST';
            if (headers?.Authorization === null &&
                basic_auth?.user &&
                basic_auth?.pass) {
                this._options.headers.Authorization = `Basic ${Buffer.from(`${basic_auth.user}:${basic_auth.pass}`).toString('base64')}`;
            }
            Object.keys(defaultHeaders).forEach((key) => {
                if (!this._options.headers?.[key])
                    this._options.headers[key] =
                        defaultHeaders[key];
            });
            if (cookies) {
                this._cookies = new cookies_1.default();
                this.headersProcessors.processors.unshift(this._cookies);
            }
        }
        this._isSecure = isSecure;
    }
    /**
     * Makes an XML-RPC call to the server specified by the constructor's options.
     *
     * @param {String} method     - The method name.
     * @param {Array} params      - Params to send in the call.
     * @param {Function} callback - function(error, value) { ... }
     *   - {Object|null} error    - Any errors when making the call, otherwise null.
     *   - {mixed} value          - The value returned in the method response.
     */
    // methodCall(method, params, callback) {
    //   const options = this._options;
    //   const xml = Serializer.serializeMethodCall(method, params, options.encoding);
    //   const transport = this.isSecure ? https : http;
    //   options.headers['Content-Length'] = Buffer.byteLength(xml, 'utf8');
    //   this.headersProcessors.composeRequest(options.headers);
    //   var request = transport.request(options, (response) => {
    //     const body = [];
    //     response.on('data', (chunk) => {
    //       body.push(chunk);
    //     });
    //     function __enrichError(err) {
    //       Object.defineProperty(err, 'req', { value: request });
    //       Object.defineProperty(err, 'res', { value: response });
    //       Object.defineProperty(err, 'body', { value: body.join('') });
    //       return err;
    //     }
    //     if (response.statusCode == 404) {
    //       callback(__enrichError(new Error('Not Found')));
    //     } else {
    //       this.headersProcessors.parseResponse(response.headers);
    //       const deserializer = new Deserializer(options.responseEncoding);
    //       deserializer.deserializeMethodResponse(response, (err, result) => {
    //         if (err) {
    //           err = __enrichError(err);
    //         }
    //         callback(err, result);
    //       });
    //     }
    //   });
    //   request.on('error', callback);
    //   request.write(xml, 'utf8');
    //   request.end();
    // };
    /**
     * Gets the cookie value by its name. The latest value received from servr with 'Set-Cookie' header is returned
     * Note that method throws an error if cookies were not turned on during client creation (see comments for constructor)
     *
     * @param {String} name name of the cookie to be obtained or changed
     * @return {string|null} cookie's value
     */
    getCookie(name) {
        if (!this._cookies)
            throw new Error('Cookies support is not turned on for this client instance');
        return this._cookies.get(name);
    }
    /**
     * Sets the cookie value by its name. The cookie will be sent to the server during the next xml-rpc call.
     * The method returns client itself, so it is possible to chain calls like the following:
     *
     * Note that method throws an error if cookies were not turned on during client creation (see comments for constructor)
     * @example client.cookie('login', 'alex').cookie('password', '123');
     *
     * @param {String} name name of the cookie to be changed
     * @param {String} value value to be set.
     * @return {Client}
     */
    setCookie(name, value) {
        if (!this._cookies)
            throw new Error('Cookies support is not turned on for this client instance');
        this._cookies.set(name, value);
        return this;
    }
}
exports.default = Client;
