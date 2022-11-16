"use strict";
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// TODO - fix this once you have XML's type
Object.defineProperty(exports, "__esModule", { value: true });
class CustomType {
    raw;
    #tagName_accessor_storage = 'customType';
    get tagName() { return this.#tagName_accessor_storage; }
    set tagName(value) { this.#tagName_accessor_storage = value; }
    constructor(raw) {
        this.raw = raw;
    }
    serialize(xml) {
        return xml.ele(this.tagName).txt(this.raw);
    }
}
exports.default = CustomType;
