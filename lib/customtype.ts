/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// TODO - fix this

// const CustomType = (module.exports = function (raw) {
//   this.raw = raw;
// });

// CustomType.prototype.serialize = function (xml) {
//   return xml.ele(this.tagName).txt(this.raw);
// };

// CustomType.prototype.tagName = 'customType';

export default class CustomType {
  raw: string;
  constructor(raw: string) {
    this.raw = raw;
  }
  serialize(xml: any) {
    return xml.ele(this.tagName).txt(this.raw);
  }
  get tagName() {
    return 'customType';
  }
}
