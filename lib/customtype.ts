/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// TODO - fix this once you have XML's type

export default class CustomType {
  raw: string;
  accessor tagName = 'customType';

  constructor(raw: string) {
    this.raw = raw;
  }
  serialize(xml: any) {
    return xml.ele(this.tagName).txt(this.raw);
  }
}
