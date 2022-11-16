/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import vows from 'vows';
import path from 'path';
import fs from 'fs';
import assert from 'assert';
import { serializeFault, serializeMethodCall, serializeMethodResponse } from '../lib/serializer';
import CustomType from '../lib/customtype';
import util from 'util';

vows
  .describe('Serializer')
  .addBatch({
    'serializeMethodCall() called with': {
      type: {
        boolean: {
          'with a true boolean param': {
            topic: function () {
              const value = true;
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the value 1': assertXml('good_food/boolean_true_call.xml')
          },
          'with a false boolean param': {
            topic: function () {
              const value = false;
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the value 0': assertXml('good_food/boolean_false_call.xml')
          }
        },

        datetime: {
          'with a regular datetime param': {
            topic: function () {
              const value = new Date(2012, 5, 7, 11, 35, 10);
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the timestamp': assertXml('good_food/datetime_call.xml')
          }
        },

        base64: {
          'with a base64 param': {
            topic: function () {
              const value = Buffer.from('dGVzdGluZw==', 'base64');
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the base64 string': assertXml('good_food/base64_call.xml')
          }
        },

        double: {
          'with a positive double param': {
            topic: function () {
              const value = 17.5;
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the positive double': assertXml('good_food/double_positive_call.xml')
          },
          'with a negative double param': {
            topic: function () {
              const value = -32.7777;
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the negative double': assertXml('good_food/double_negative_call.xml')
          }
        },

        integer: {
          'with a positive integer param': {
            topic: function () {
              const value = 17;
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the positive integer': assertXml('good_food/int_positive_call.xml')
          },
          'with a negative integer param': {
            topic: function () {
              const value = -32;
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the negative integer': assertXml('good_food/int_negative_call.xml')
          },
          'with an integer param of 0': {
            topic: function () {
              const value = 0;
              return serializeMethodCall('testMethod', [value]);
            },
            'contains 0': assertXml('good_food/int_zero_call.xml')
          }
        },

        nil: {
          'with a null param': {
            topic: function () {
              const value = null;
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the nil': assertXml('good_food/nil_call.xml')
          }
        },

        string: {
          'with a regular string param': {
            topic: function () {
              const value = 'testString';
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the string': assertXml('good_food/string_call.xml')
          },
          'with a string param that requires CDATA': {
            topic: function () {
              const value = '<html><body>Congrats</body></html>';
              return serializeMethodCall('testCDATAMethod', [value]);
            },
            'contains the CDATA-wrapped string': assertXml('good_food/string_cdata_call.xml')
          },
          'with a multiline string param that requires CDATA': {
            topic: function () {
              const value = '<html>\n<head><title>Go testing!</title></head>\n<body>Congrats</body>\n</html>';
              return serializeMethodCall('testCDATAMethod', [value]);
            },
            'contains the CDATA-wrapped string': assertXml('good_food/string_multiline_cdata_call.xml')
          },
          'with an empty string': {
            topic: function () {
              const value = '';
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the empty string': assertXml('good_food/string_empty_call.xml')
          },
          'with a string contains emoji': {
            topic: function () {
              const value = Buffer.from('f09f9881', 'hex').toString('utf-8');
              return serializeMethodCall('testMethod', [value]);
            },
            'contains a smiley': assertXml('good_food/string_emoji.xml')
          }
        },

        undefined: {
          'with an undefined param': {
            topic: function () {
              const value = undefined;
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the empty value': assertXml('good_food/undefined_call.xml')
          }
        }
      },

      compound: {
        array: {
          'with a simple array': {
            topic: function () {
              const value = ['string1', 3];
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the array': assertXml('good_food/array_call.xml')
          }
        },

        struct: {
          'with a one-level struct': {
            topic: function () {
              const value = {
                stringName: 'string1',
                intName: 3
              };
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the struct': assertXml('good_food/struct_call.xml')
          },
          'with a one-level struct and an empty property name': {
            topic: function () {
              const value = {
                stringName: '',
                intName: 3
              };
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the struct': assertXml('good_food/struct_empty_property_call.xml')
          },
          'with a two-level struct': {
            topic: function () {
              const value = {
                stringName: 'string1',
                objectName: {
                  intName: 4
                }
              };
              return serializeMethodCall('testMethod', [value]);
            },
            'contains the struct': assertXml('good_food/struct_nested_call.xml')
          }
        }
      },
      CustomType: {
        default: {
          topic: function () {
            const value = new CustomType('testCustomType');
            return serializeMethodCall('testMethod', [value]);
          },
          'contains the customType': assertXml('good_food/customtype_call.xml')
        },
        extended: {
          topic: function () {
            const ExtendedCustomType = function (raw) {
              raw = `extended${raw}`;
              CustomType.call(this, raw);
            };
            util.inherits(ExtendedCustomType, CustomType);
            ExtendedCustomType.prototype.tagName = 'extendedCustomType';
            const value = new ExtendedCustomType('TestCustomType');
            return serializeMethodCall('testMethod', [value]);
          },
          'contains the customType': assertXml('good_food/customtype_extended_call.xml')
        }
      },
      'utf-8 encoding': {
        topic: function () {
          const value = '\x46\x6F\x6F';
          return serializeMethodCall('testMethod', [value], 'utf-8');
        },
        'contains the encoding attribute': assertXml('good_food/encoded_call.xml')
      }
    },

    'serializeMethodResponse() called with': {
      type: {
        boolean: {
          'with a true boolean param': {
            topic: function () {
              const value = true;
              return serializeMethodResponse(value);
            },
            'contains the value 1': assertXml('good_food/boolean_true_response.xml')
          },
          'with a false boolean param': {
            topic: function () {
              const value = false;
              return serializeMethodResponse(value);
            },
            'contains the value 0': assertXml('good_food/boolean_false_response.xml')
          }
        },

        datetime: {
          'with a regular datetime param': {
            topic: function () {
              const value = new Date(2012, 5, 8, 11, 35, 10);
              return serializeMethodResponse(value);
            },
            'contains the timestamp': assertXml('good_food/datetime_response.xml')
          }
        },

        base64: {
          'with a base64 param': {
            topic: function () {
              const value = Buffer.from('dGVzdGluZw==', 'base64');
              return serializeMethodResponse(value);
            },
            'contains the base64 string': assertXml('good_food/base64_response.xml')
          }
        },

        double: {
          'with a positive double param': {
            topic: function () {
              const value = 3.141592654;
              return serializeMethodResponse(value);
            },
            'contains the positive double': assertXml('good_food/double_positive_response.xml')
          },
          'with a negative double param': {
            topic: function () {
              const value = -1.41421;
              return serializeMethodResponse(value);
            },
            'contains the negative double': assertXml('good_food/double_negative_response.xml')
          }
        },

        integer: {
          'with a positive integer param': {
            topic: function () {
              const value = 4;
              return serializeMethodResponse(value);
            },
            'contains the positive integer': assertXml('good_food/int_positive_response.xml')
          },
          'with a negative integer param': {
            topic: function () {
              const value = -4;
              return serializeMethodResponse(value);
            },
            'contains the negative integer': assertXml('good_food/int_negative_response.xml')
          },
          'with an integer param of 0': {
            topic: function () {
              const value = 0;
              return serializeMethodResponse(value);
            },
            'contains 0': assertXml('good_food/int_zero_response.xml')
          }
        },

        string: {
          'with a regular string param': {
            topic: function () {
              const value = 'testString';
              return serializeMethodResponse(value);
            },
            'contains the string': assertXml('good_food/string_response.xml')
          },
          'with an empty string': {
            topic: function () {
              const value = '';
              return serializeMethodResponse(value);
            },
            'contains the empty string': assertXml('good_food/string_empty_response.xml')
          },
          'with string contains emoji': {
            topic: function () {
              const value = Buffer.from('f09f9881', 'hex').toString('utf-8');
              return serializeMethodResponse(value);
            },
            'contains emoji': assertXml('good_food/string_emoji_response.xml')
          }
        },

        undefined: {
          'with an undefined param': {
            topic: function () {
              const value = undefined;
              return serializeMethodResponse(value);
            },
            'contains the empty value': assertXml('good_food/undefined_response.xml')
          }
        }
      },

      compound: {
        array: {
          'with a simple array': {
            topic: function () {
              const value = [178, 'testString'];
              return serializeMethodResponse(value);
            },
            'contains the array': assertXml('good_food/array_response.xml')
          }
        },

        struct: {
          'with a one-level struct': {
            topic: function () {
              const value = {
                'the-Name': 'testValue'
              };
              return serializeMethodResponse(value);
            },
            'contains the struct': assertXml('good_food/struct_response.xml')
          },
          'with a two-level struct': {
            topic: function () {
              const value = {
                theName: 'testValue',
                anotherName: {
                  nestedName: 'nestedValue'
                },
                lastName: 'Smith'
              };
              return serializeMethodResponse(value);
            },
            'contains the struct': assertXml('good_food/struct_nested_response.xml')
          }
        },

        fault: {
          'with a fault': {
            topic: function () {
              const value = {
                faultCode: 4,
                faultString: 'Too many parameters.'
              };
              return serializeFault(value);
            },
            'contains the fault': assertXml('good_food/fault.xml')
          }
        }
      },

      CustomType: {
        default: {
          topic: function () {
            const value = new CustomType('testCustomType');
            return serializeMethodResponse(value);
          },
          'contains the customType': assertXml('good_food/customtype_response.xml')
        },
        extended: {
          topic: function () {
            const ExtendedCustomType = function (raw) {
              raw = `extended${raw}`;
              CustomType.call(this, raw);
            };
            util.inherits(ExtendedCustomType, CustomType);
            ExtendedCustomType.prototype.tagName = 'extendedCustomType';
            const value = new ExtendedCustomType('TestCustomType');
            return serializeMethodResponse(value);
          },
          'contains the customType': assertXml('good_food/customtype_extended_response.xml')
        }
      }
    }
  })
  .export(module);

//==============================================================================
// Utilities
//==============================================================================

function assertXml(fileName) {
  return function (result) {
    const file = path.join(__dirname, 'fixtures', fileName);
    const xml = fs.readFileSync(file, 'utf8').trim();
    assert.strictEqual(result, xml);
  };
}
