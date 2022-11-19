/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import vows from 'vows';
import assert from 'assert';
import http from 'http';
import fs from 'fs';
import Client from '../lib/client';

const VALID_RESPONSE = fs.readFileSync(`${__dirname}/fixtures/good_food/string_response.xml`);
const BROKEN_XML = fs.readFileSync(`${__dirname}/fixtures/bad_food/broken_xml.xml`);

vows
  .describe('Client')
  .addBatch({
    //////////////////////////////////////////////////////////////////////
    // Test Constructor functionality
    //////////////////////////////////////////////////////////////////////
    'A constructor': {
      // Test standard Client initialization
      'with URI options only': {
        topic: function () {
          const client = new Client({ host: 'localhost', port: 9999, path: '/' }, false);
          return client.options;
        },
        'contains the standard headers': function (topic) {
          const headers = {
            'User-Agent': 'NodeJS XML-RPC Client',
            'Content-Type': 'text/xml',
            Accept: 'text/xml',
            'Accept-Charset': 'UTF8',
            Connection: 'Keep-Alive'
          };
          assert.deepEqual(topic, {
            host: 'localhost',
            port: 9999,
            path: '/',
            method: 'POST',
            headers: headers
          });
        }
      },
      // Test passing string URI for options
      'with a string URI for options': {
        topic: function () {
          const client = new Client('http://localhost:9999', false);
          return client.options;
        },
        'parses the string URI into URI fields': function (topic) {
          assert.strictEqual(topic.host, 'localhost');
          assert.strictEqual(topic.path, '/');
          assert.equal(topic.port, 9999);
        }
      },
      // Test passing custom headers to the Client
      'with options containing header params': {
        topic: function () {
          const client = new Client(
            {
              host: 'localhost',
              port: 9999,
              path: '/',
              headers: {
                'User-Agent': 'Testaroo',
                Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
              }
            },
            false
          );
          return client.options;
        },
        'does not overwrite the custom headers': function (topic) {
          const headers = {
            'User-Agent': 'Testaroo',
            Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
            'Content-Type': 'text/xml',
            Accept: 'text/xml',
            'Accept-Charset': 'UTF8',
            Connection: 'Keep-Alive'
          };
          assert.deepEqual(topic, {
            host: 'localhost',
            port: 9999,
            path: '/',
            method: 'POST',
            headers: headers
          });
        }
      },
      // Test passing HTTP Basic authentication credentials
      'with basic auth passed': {
        topic: function () {
          const client = new Client({ basic_auth: { user: 'john', pass: '12345' } }, false);
          return client.options.headers;
        },
        "correctly encodes and sets the 'Authorization' header": function (topic) {
          assert.isNotNull(topic.Authorization);
          assert.equal(topic.Authorization, 'Basic am9objoxMjM0NQ==');
        }
      },
      'with a string URI inside options': {
        topic: function () {
          const client = new Client({ url: 'http://localhost:9999' }, false);
          return client.options;
        },
        'parses the string URI into URI fields': function (topic) {
          assert.strictEqual(topic.host, 'localhost');
          assert.strictEqual(topic.path, '/');
          assert.equal(topic.port, 9999);
        }
      },
      // Test passing encoding
      'with an encoding passed': {
        topic: function () {
          const client = new Client({ url: 'http://localhost:9999', encoding: 'utf-8' }, false);
          return client.options;
        },
        'caches the encoding option': function (topic) {
          assert.strictEqual(topic.encoding, 'utf-8');
        }
      }
    },
    //////////////////////////////////////////////////////////////////////
    // Test method call functionality
    //////////////////////////////////////////////////////////////////////
    'A method call': {
      // Test invalid internal URI to send method call to
      'with an invalid internal URI': {
        topic: function () {
          const client = new Client({ host: 'localhost', port: 9999, path: '/' }, false);
          client.methodCall('getArray', null, this.callback);
        },
        'contains the error': function (error, value) {
          assert.isObject(error);
        }
      },
      'with a string URI for options': {
        topic: function () {
          const that = this;
          // Basic http server that sends a chunked XML response
          http
            .createServer((request, response) => {
              response.writeHead(200, { 'Content-Type': 'text/xml' });
              const data =
                '<?xml version="2.0" encoding="UTF-8"?>' +
                '<methodResponse>' +
                '<params>' +
                '<param><value><string>more.listMethods</string></value></param>' +
                '</params>' +
                '</methodResponse>';
              response.write(data);
              response.end();
            })
            .listen(9090, 'localhost', () => {
              const client = new Client('http://localhost:9090', false);
              client.methodCall('listMethods', null, that.callback);
            });
        },
        'contains the string': function (error, value) {
          assert.isNull(error);
          assert.deepEqual(value, 'more.listMethods');
        }
      },
      'with no host specified': {
        topic: function () {
          const that = this;
          // Basic http server that sends a chunked XML response
          http
            .createServer((request, response) => {
              response.writeHead(200, { 'Content-Type': 'text/xml' });
              const data =
                '<?xml version="2.0" encoding="UTF-8"?>' +
                '<methodResponse>' +
                '<params>' +
                '<param><value><string>system.listMethods</string></value></param>' +
                '</params>' +
                '</methodResponse>';
              response.write(data);
              response.end();
            })
            .listen(9091, 'localhost', () => {
              const client = new Client({ port: 9091, path: '/' }, false);
              client.methodCall('listMethods', null, that.callback);
            });
        },
        'contains the string': function (error, value) {
          assert.isNull(error);
          assert.deepEqual(value, 'system.listMethods');
        }
      },
      'with a chunked response': {
        topic: function () {
          const that = this;
          // Basic http server that sends a chunked XML response
          http
            .createServer((request, response) => {
              response.writeHead(200, { 'Content-Type': 'text/xml' });
              const chunk1 =
                '<?xml version="2.0" encoding="UTF-8"?>' +
                '<methodResponse>' +
                '<params>' +
                '<param><value><array><data>' +
                '<value><string>system.listMethods</string></value>' +
                '<value><string>system.methodSignature</string></value>';
              const chunk2 =
                '<value><string>xmlrpc_dialect</string></value>' +
                '</data></array></value></param>' +
                '</params>' +
                '</methodResponse>';
              response.write(chunk1);
              response.write(chunk2);
              response.end();
            })
            .listen(9092, 'localhost', () => {
              const client = new Client({ host: 'localhost', port: 9092, path: '/' }, false);
              client.methodCall('listMethods', null, that.callback);
            });
        },
        'contains the array': function (error, value) {
          assert.isNull(error);
          assert.deepEqual(value, ['system.listMethods', 'system.methodSignature', 'xmlrpc_dialect']);
        }
      },
      'with a utf-8 encoding': {
        topic: function () {
          const that = this;
          http
            .createServer((request, response) => {
              response.writeHead(200, { 'Content-Type': 'text/xml' });
              const data =
                '<?xml version="2.0" encoding="UTF-8"?>' +
                '<methodResponse>' +
                '<params>' +
                '<param><value><string>here is mr. Snowman: ☃</string></value></param>' +
                '</params>' +
                '</methodResponse>';
              response.write(data);
              response.end();
            })
            .listen(9093, 'localhost', () => {
              const client = new Client('http://localhost:9093', false);
              client.methodCall('listMethods', null, that.callback);
            });
        },
        'contains the correct string': function (error, value) {
          assert.isNull(error);
          assert.deepEqual(value, 'here is mr. Snowman: ☃');
        }
      },
      'with a ISO-8859-1 encoding': {
        topic: function () {
          const that = this;
          http
            .createServer((request, response) => {
              response.writeHead(200, { 'Content-Type': 'text/xml' });
              // To prevent including a npm package that needs to compile (iconv):
              // The following iso 8859-1 text below in hex
              //   <?xml version="1.0" encoding="ISO-8859-1"?>
              //   <methodResponse>
              //   <params>
              //   <param><value><string>äè12</string></value></param>
              //   </params>
              //   </methodResponse>
              const hex =
                '3c3f786d6c2076657273696f6e3d22312e302220656e636' +
                'f64696e673d2249534f2d383835392d31223f3e3c6d6574686f64' +
                '526573706f6e73653e3c706172616d733e3c706172616d3e3c766' +
                '16c75653e3c737472696e673ee4e831323c2f737472696e673e3c' +
                '2f76616c75653e3c2f706172616d3e3c2f706172616d733e3c2f6' +
                'd6574686f64526573706f6e73653e';
              const hexData = Buffer.from(hex, 'hex');
              response.write(hexData);
              response.end();
            })
            .listen(9094, 'localhost', () => {
              const client = new Client(
                {
                  host: 'localhost',
                  port: 9094,
                  path: '/',
                  responseEncoding: 'binary'
                },
                false
              );
              client.methodCall('listMethods', null, that.callback);
            });
        },
        'contains the correct string': function (error, value) {
          assert.isNull(error);
          assert.deepEqual(value, 'äè12');
        }
      },
      'with a multi-byte character in request': {
        topic: function () {
          let that = this,
            requestBody = '';
          http
            .createServer((request, response) => {
              request.setEncoding('utf8');
              request.on('data', (chunk) => {
                requestBody += chunk;
              });
              request.on('end', () => {
                response.writeHead(200, { 'Content-Type': 'text/xml' });
                const data =
                  '<?xml version="2.0" encoding="UTF-8"?>' +
                  '<methodResponse>' +
                  '<params>' +
                  '<param><value><string>ok</string></value></param>' +
                  '</params>' +
                  '</methodResponse>';
                response.write(data);
                response.end();
              });
            })
            .listen(9095, 'localhost', () => {
              const client = new Client({ host: 'localhost', port: 9095, path: '/' }, false);
              client.methodCall('multiByte', ['ö'], (error) => {
                that.callback(error, requestBody);
              });
            });
        },
        'contains full request': function (error, value) {
          const data =
            '<?xml version="1.0"?>' +
            '<methodCall>' +
            '<methodName>multiByte</methodName>' +
            '<params><param><value><string>ö</string></value></param></params>' +
            '</methodCall>';
          assert.isNull(error);
          assert.deepEqual(value, data);
        }
      },
      'with an unknown request': {
        topic: function () {
          const that = this;
          http
            .createServer((request, response) => {
              response.writeHead(404);
              response.end();
            })
            .listen(9099, 'localhost', () => {
              const client = new Client({ host: 'localhost', port: 9099, path: '/' }, false);
              client.methodCall('unknown', null, (error) => {
                that.callback(error);
              });
            });
        },
        'return NotFound Error': function (error, value) {
          assert.isObject(error);
        }
      },
      'with cookies in response': {
        topic: function () {
          const that = this;
          let invokeCount = 0;
          http
            .createServer((request, response) => {
              response.writeHead(200, {
                'Content-Type': 'text/xml',
                'Set-Cookie': 'a=b'
              });
              response.write(VALID_RESPONSE);
              response.end();
              invokeCount++;
              if (invokeCount == 2) {
                that.callback(undefined, request.headers.cookie);
              }
            })
            .listen(9096, 'localhost', () => {
              const client = new Client({ host: 'localhost', port: 9096, path: '/', cookies: true }, false);
              function cbIfError(err, result) {
                if (err) that.callback(err, result);
              }
              client.methodCall('1', null, (err, result) => {
                cbIfError(err, result);
                client.methodCall('2', null, cbIfError);
              });
            });
        },
        'sends them back to the server': function (error, value) {
          assert.isNull(error, 'Error was received but not expected');
          assert.equal(value, 'a=b');
        }
      },
      'that responds with a malformed xml': {
        topic: function () {
          const that = this;
          http
            .createServer((request, response) => {
              response.writeHead(500, { 'Content-Type': 'text/html' });
              response.write(BROKEN_XML);
              response.end();
            })
            .listen(9097, 'localhost', () => {
              const client = new Client({ host: 'localhost', port: 9097, path: '/' }, false);
              client.methodCall('broken', null, that.callback);
            });
        },
        'returns an error': function (error, value) {
          assert.instanceOf(error, Error);
          assert.match(error.message, /^Unexpected end/);
        },
        'returns the request object with the error': function (error, value) {
          assert.instanceOf(error, Error);
          assert.isObject(error.req);
          assert.isObject(error.req.connection);
          assert.isString(error.req._header);
        },
        'returns the response object with the error': function (error, value) {
          assert.instanceOf(error, Error);
          assert.isObject(error.res);
          assert.strictEqual(error.res.statusCode, 500);
        },
        'returns the body with the error': function (error, value) {
          assert.strictEqual(error.body, BROKEN_XML.toString());
        }
      }
    }
  })
  .export(module);
