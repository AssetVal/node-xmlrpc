"use strict";
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// TODO - fix this
Object.defineProperty(exports, "__esModule", { value: true });
// const CustomType = (module.exports = function (raw) {
//   this.raw = raw;
// });
// CustomType.prototype.serialize = function (xml) {
//   return xml.ele(this.tagName).txt(this.raw);
// };
// CustomType.prototype.tagName = 'customType';
class CustomType {
    raw;
    constructor(raw) {
        this.raw = raw;
    }
    serialize(xml) {
        return xml.ele(this.tagName).txt(this.raw);
    }
    get tagName() {
        return 'customType';
    }
}
exports.default = CustomType;
