/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// TODO remove these before merging

import http from 'http';
import https from 'https';
import { URL } from 'url';
import Cookies from './cookies';
import Deserializer from './deserializer';
import { serializeMethodCall } from './serializer';

interface ClientOptions {
  host?: string | undefined | null;
  path?: string | undefined | null;
  port?: number | undefined;
  url?: string | undefined;
  cookies?: boolean | undefined;
  headers?:
    | Record<'User-Agent' | 'Content-Type' | 'Accept' | 'Accept-Charset' | 'Connection' | string, string>
    | undefined;
  basic_auth?: { user: string; pass: string } | undefined;
  method?: string | undefined;
}
type URIString = `${string}://${string}:${number}`;

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
export default class Client {
  _options: ClientOptions & {
    headers: Record<'User-Agent' | 'Content-Type' | 'Accept' | 'Accept-Charset' | 'Connection' | string, string> & {
      'Content-Length'?: number;
    };
    responseEncoding?: string;
    encoding?: string;
  } = { headers: {} };
  _isSecure: boolean;
  _cookies: Cookies | undefined;
  headersProcessors = {
    processors: [] as Array<any>,
    composeRequest: function (headers: any) {
      this.processors.forEach((p) => {
        p.composeRequest(headers);
      });
    },
    parseResponse: function (headers: any) {
      this.processors.forEach((p) => {
        p.parseResponse(headers);
      });
    }
  };

  constructor(options: ClientOptions | URIString, isSecure: boolean) {
    const defaultHeaders = {
      'User-Agent': 'NodeJS XML-RPC Client',
      'Content-Type': 'text/xml',
      Accept: 'text/xml',
      'Accept-Charset': 'UTF8',
      Connection: 'Keep-Alive'
    };

    if (typeof options === 'string') {
      const clientURL = new URL(options);
      this._options.host = clientURL.hostname;
      this._options.path = clientURL.pathname;
    } else {
      const { url, cookies, headers, basic_auth, method } = options;
      if (url) {
        const clientURL = new URL(url);
        this._options.host = clientURL.hostname;
        this._options.path = clientURL.pathname;
        this._options.port = clientURL.port ? parseInt(clientURL.port, 10) : undefined;
      }

      if (headers) this._options.headers = headers || {};
      if (method) this._options.method = method ?? 'POST';

      if (headers?.Authorization === null && basic_auth?.user && basic_auth?.pass) {
        this._options.headers.Authorization = `Basic ${Buffer.from(`${basic_auth.user}:${basic_auth.pass}`).toString(
          'base64'
        )}`;
      }

      Object.keys(defaultHeaders).forEach((key) => {
        if (!this._options.headers?.[key])
          this._options.headers[key] = defaultHeaders[key as keyof typeof defaultHeaders];
      });

      if (cookies) {
        this._cookies = new Cookies();
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
  methodCall(
    method: string,
    params: Array<string>,
    callback: ((err: Error) => void) | ((arg0: any, arg1: unknown) => void)
  ) {
    const options = this._options;
    // @ts-ignore TODO check this out
    const xml = serializeMethodCall(method, params, options.encoding);
    const transport = this._isSecure ? https : http;

    options.headers['Content-Length'] = Buffer.byteLength(xml, 'utf8');

    this.headersProcessors.composeRequest(options.headers);
    const request = transport.request(options, (response) => {
      const body: any[] = [];

      response.on('data', (chunk) => {
        body.push(chunk);
      });

      function __enrichError(err: Error) {
        Object.defineProperty(err, 'req', { value: request });
        Object.defineProperty(err, 'res', { value: response });
        Object.defineProperty(err, 'body', { value: body.join('') });
        return err;
      }

      if (response.statusCode === 404) {
        callback(__enrichError(new Error('Not Found')), null);
      } else {
        this.headersProcessors.parseResponse(response.headers);

        const deserializer = new Deserializer(options.responseEncoding);

        deserializer.deserializeMethodResponse(response, (err: any, result: any) => {
          if (err) err = __enrichError(err as unknown as Error);
          callback(err, result as unknown);
        });
      }
    });

    request.on('error', callback);
    request.write(xml, 'utf8');
    request.end();
  }

  /**
   * Gets the cookie value by its name. The latest value received from server with 'Set-Cookie' header is returned
   * Note that method throws an error if cookies were not turned on during client creation (see comments for constructor)
   *
   * @param {String} name name of the cookie to be obtained or changed
   * @return {string|null} cookie's value
   */
  public getCookie(name: string) {
    if (!this._cookies) throw new Error('Cookies support is not turned on for this client instance');
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
  setCookie(name: string, value: string) {
    if (!this._cookies) throw new Error('Cookies support is not turned on for this client instance');
    this._cookies.set(name, value);
    return this;
  }
}
