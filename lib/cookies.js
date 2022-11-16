"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cookie {
    value;
    expires;
    secure;
    new;
    constructor(value, options) {
        this.value = value;
        if (options) {
            this.expires = options.expires;
            this.secure = options.secure;
            this.new = options.new;
        }
    }
}
class Cookies {
    cookies = {};
    /**
     * Obtains value of the cookie with specified name.
     * This call checks expiration dates and does not return expired cookies.
     * @param {String} name cookie name
     * @return {String|null} cookie value or null
     */
    get(name) {
        const cookie = this.cookies[name];
        if (cookie && this.checkNotExpired(name))
            return this.cookies[name].value;
        return null;
    }
    /**
     * Sets cookie's value and optional options
     * @param {String} name cookie's name
     * @param {String} value value
     * @param {Object|undefined} options with the following fields:
     *  - {Boolean} secure - is cookie secure or not (does not mean anything for now)
     *  - {Date} expires - cookie's expiration date. If specified then cookie will disappear after that date
     */
    set(name, value, options) {
        if (this.checkNotExpired(name)) {
            this.cookies[name] = new Cookie(value, options);
        }
    }
    // For testing purposes
    getExpirationDate(name) {
        return this.cookies[name] ? this.cookies[name].expires : null;
    }
    // Internal function
    checkNotExpired(name, cookie) {
        if (typeof cookie !== 'object' || !('expires' in cookie))
            cookie = this.cookies[name];
        const now = new Date();
        if (cookie instanceof Cookie && cookie.expires && now > cookie.expires) {
            delete this.cookies[name];
            return false;
        }
        return true;
    }
    /**
     * Parses headers from server's response for 'set-cookie' header and store cookie's values.
     * Also parses expiration date
     * @param headers
     */
    parseResponse(headers) {
        const cookies = headers['set-cookie'];
        cookies?.forEach((cookie) => {
            const cookiesParams = cookie.split(';');
            const cookiePair = cookiesParams.shift()?.split('=') ?? [];
            const options = {};
            cookiesParams.forEach((param) => {
                param = param.trim();
                if (param.toLowerCase().indexOf('expires') === 0) {
                    const date = param.split('=')[1].trim();
                    options.expires = new Date(date);
                }
            });
            if (cookiePair.length > 0)
                this.set(cookiePair[0].trim(), cookiePair[1].trim(), options);
        });
    }
    /**
     * Adds cookies to the provided headers as array. Does nothing if there are no cookies stored.
     * This call checks expiration dates and does not add expired cookies.
     * @param headers
     */
    composeRequest(headers) {
        if (Object.keys(this.cookies).length === 0)
            return;
        headers.Cookie = this.toString();
    }
    /**
     *
     * @return {String} cookies as 'name=value' pairs joined by semicolon
     */
    toString() {
        return Object.keys(this.cookies)
            .filter(this.checkNotExpired.bind(this))
            .map(name => `${name}=${this.cookies[name].value}`)
            .join(';');
    }
}
exports.default = Cookies;
