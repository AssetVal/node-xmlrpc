import { SAXStream, createStream } from 'sax';
import dateFormatter from './date_formatter';

export default class Deserializer {
  type: string | null = null;
  responseType: string | null = null;
  stack: Array<any> = [];
  marks: Array<number> = [];
  data: Array<string> = [];
  methodname: string | null = null;
  encoding: string;
  value = false;
  callback: ((error?: unknown, results?: unknown) => void) | null = null;
  error: unknown = null;
  parser: SAXStream = createStream();

  constructor(encoding?: string) {
    this.encoding = encoding ?? 'utf8';

    this.parser.on('opentag', this.onOpentag.bind(this));
    this.parser.on('closetag', this.onClosetag.bind(this));
    this.parser.on('text', this.onText.bind(this));
    this.parser.on('cdata', this.onCDATA.bind(this));
    this.parser.on('end', this.onDone.bind(this));
    this.parser.on('error', this.onError.bind(this));
  }

  deserializeMethodResponse(stream: any, callback: any) {
    const that = this;

    this.callback = function (error, result) {
      if (error) {
        callback(error);
      } else if (result.length > 1) {
        callback(new Error('Response has more than one param'));
      } else if (that.type !== 'methodresponse') {
        callback(new Error('Not a method response'));
      } else if (!that.responseType) {
        callback(new Error('Invalid method response'));
      } else {
        callback(null, result[0]);
      }
    };

    stream.setEncoding(this.encoding);
    stream.on('error', this.onError.bind(this));
    stream.pipe(this.parser);
  }

  deserializeMethodCall(stream: any, callback: any) {
    const that = this;

    this.callback = function (error, result) {
      if (error) {
        callback(error);
      } else if (that.type !== 'methodcall') {
        callback(new Error('Not a method call'));
      } else if (!that.methodname) {
        callback(new Error('Method call did not contain a method name'));
      } else {
        callback(null, that.methodname, result);
      }
    };

    stream.setEncoding(this.encoding);
    stream.on('error', this.onError.bind(this));
    stream.pipe(this.parser);
  }

  onDone() {
    const that = this;

    if (!this.error) {
      if (this.type === null || this.marks.length) {
        if (this.callback) this.callback(new Error('Invalid XML-RPC message'));
      } else if (this.responseType === 'fault') {
        const createFault = function (fault: { faultString: any; faultCode: any }) {
          const error = new Error(`XML-RPC fault${fault.faultString ? `: ${fault.faultString}` : ''}`);
          error.code = fault.faultCode;
          error.faultCode = fault.faultCode;
          error.faultString = fault.faultString;
          return error;
        };
        if (this.callback) this.callback(createFault(this.stack[0]));
      } else {
        if (this.callback) this.callback(undefined, this.stack);
      }
    }
  }

  // TODO:
  // Error handling needs a little thinking. There are two different kinds of
  // errors:
  //   1. Low level errors like network, stream or xml errors. These don't
  //      require special treatment. They only need to be forwarded. The IO
  //      is already stopped in these cases.
  //   2. Protocol errors: Invalid tags, invalid values &c. These happen in
  //      our code and we should tear down the IO and stop parsing.
  // Currently all errors end here. Guess I'll split it up.
  onError(msg: unknown) {
    if (!this.error) {
      if (typeof msg === 'string') {
        this.error = new Error(msg);
      } else {
        this.error = msg;
      }
      if (this.callback) this.callback(this.error);
    }
  }

  push(value: string | number | null | boolean | Date | Buffer) {
    this.stack.push(value);
  }

  //==============================================================================
  // SAX Handlers
  //==============================================================================

  onOpentag(node: { name: string }) {
    if (node.name === 'ARRAY' || node.name === 'STRUCT') {
      this.marks.push(this.stack.length);
    }
    this.data = [];
    this.value = node.name === 'VALUE';
  }

  onText(text: string) {
    this.data.push(text);
  }
  onCDATA(cdata: string) {
    this.data.push(cdata);
  }

  onClosetag(el: string) {
    const data = this.data.join('');

    try {
      switch (el) {
        case 'BOOLEAN':
          this.endBoolean(data);
          break;
        case 'INT':
        case 'I4':
          this.endInt(data);
          break;
        case 'I8':
          this.endI8(data);
          break;
        case 'DOUBLE':
          this.endDouble(data);
          break;
        case 'STRING':
        case 'NAME':
          this.endString(data);
          break;
        case 'ARRAY':
          this.endArray();
          break;
        case 'STRUCT':
          this.endStruct();
          break;
        case 'BASE64':
          this.endBase64(data);
          break;
        case 'DATETIME.ISO8601':
          this.endDateTime(data);
          break;
        case 'VALUE':
          this.endValue(data);
          break;
        case 'PARAMS':
          this.endParams();
          break;
        case 'FAULT':
          this.endFault();
          break;
        case 'METHODRESPONSE':
          this.endMethodResponse();
          break;
        case 'METHODNAME':
          this.endMethodName(data);
          break;
        case 'METHODCALL':
          this.endMethodCall();
          break;
        case 'NIL':
          this.endNil();
          break;
        case 'DATA':
        case 'PARAM':
        case 'MEMBER':
          // Ignored by design
          break;
        default:
          this.onError(`Unknown XML-RPC tag '${el}'`);
          break;
      }
    } catch (e) {
      this.onError(e);
    }
  }

  endNil() {
    this.push(null);
    this.value = false;
  }

  endBoolean(data: string) {
    if (data === '1') {
      this.push(true);
    } else if (data === '0') {
      this.push(false);
    } else {
      throw new Error(`Illegal boolean value '${data}'`);
    }
    this.value = false;
  }

  endInt(data: string) {
    const value = parseInt(data, 10);
    if (Number.isNaN(value)) {
      throw new Error(`Expected an integer but got '${data}'`);
    } else {
      this.push(value);
      this.value = false;
    }
  }

  endDouble(data: string) {
    const value = parseFloat(data);
    if (Number.isNaN(value)) {
      throw new Error(`Expected a double but got '${data}'`);
    } else {
      this.push(value);
      this.value = false;
    }
  }

  endString(data: string) {
    this.push(data);
    this.value = false;
  }

  endArray() {
    const mark = this.marks.pop() as number;
    this.stack.splice(mark, this.stack.length - mark, this.stack.slice(mark));
    this.value = false;
  }

  endStruct() {
    const mark = this.marks.pop() as number;
    const struct = {};
    const items = this.stack.slice(mark);

    for (let i = 0; i < items.length; i += 2) {
      struct[items[i]] = items[i + 1];
    }

    this.stack.splice(mark, this.stack.length - mark, struct);
    this.value = false;
  }

  endBase64(data: string) {
    const buffer = Buffer.from(data, 'base64');
    this.push(buffer);
    this.value = false;
  }

  endDateTime(data: string) {
    this.push(dateFormatter.decodeIso8601(data));
    this.value = false;
  }

  endI8(data: string) {
    const isInteger = /^-?\d+$/;

    if (!isInteger.test(data)) {
      throw new Error(`Expected integer (I8) value but got '${data}'`);
    } else {
      this.endString(data);
    }
  }

  endValue(data: string) {
    if (this.value) this.endString(data);
  }
  endParams() {
    this.responseType = 'params';
  }
  endFault() {
    this.responseType = 'fault';
  }
  endMethodResponse() {
    this.type = 'methodresponse';
  }
  endMethodName(data: string) {
    this.methodname = data;
  }
  endMethodCall() {
    this.type = 'methodcall';
  }
}
