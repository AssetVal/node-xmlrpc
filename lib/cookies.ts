class Cookie {
  value: string;
  expires?: Date;
  secure?: boolean;
  new?: boolean;

  constructor(
    value: string,
    options?: { expires?: Date; secure?: boolean; new?: boolean }
  ) {
    this.value = value;
    if (options) {
      this.expires = options.expires;
      this.secure = options.secure;
      this.new = options.new;
    }
  }
}

/**
 * A Es6 Class Version of the Cookies.js
 */
export default class Cookies {
  cookies: Record<string, Cookie> = {};

  /**
   * Obtains value of the cookie with specified name.
   * This call checks expiration dates and does not return expired cookies.
   * @param {String} name cookie name
   * @return {String|null} cookie value or null
   */
  public get(name: string) {
    const cookie = this.cookies[name];
    if (cookie && this.checkNotExpired(name)) {
      return this.cookies[name].value;
    }
    return null;
  }

  /**
   * Sets cookie's value and optional options
   * @param {String} name cookie's name
   * @param {String} value value
   * @param {Object} options with the following fields:
   *  - {Boolean} secure - is cookie secure or not (does not mean anything for now)
   *  - {Date} expires - cookie's expiration date. If specified then cookie will disappear after that date
   */
  public set(
    name: string,
    value: string,
    options?: { expires: Date; secure?: boolean; new?: boolean }
  ) {
    if (this.checkNotExpired(name)) {
      this.cookies[name] = new Cookie(value, options);
    }
  }

  // For testing purposes
  public getExpirationDate(name: string) {
    return this.cookies[name] ? this.cookies[name].expires : null;
  }

  // Internal function
  private checkNotExpired(name: string, cookie?: Cookie | any) {
    if (typeof cookie !== 'object' || !('expires' in cookie))
      cookie = this.cookies[name] as Cookie;

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
  public parseResponse(headers: { 'set-cookie': Array<string> }) {
    const cookies = headers['set-cookie'];

    cookies?.forEach((cookie) => {
      const cookiesParams = cookie.split(';');
      const cookiePair = cookiesParams.shift()?.split('=') ?? [];
      const options: { expires?: Date } = {};

      cookiesParams.forEach((param) => {
        param = param.trim();
        if (param.toLowerCase().indexOf('expires') === 0) {
          const date = param.split('=')[1].trim();
          options.expires = new Date(date);
        }
      });

      if (cookiePair.length > 0)
        this.set(
          cookiePair[0].trim(),
          cookiePair[1].trim(),
          options as { expires: Date }
        );
    });
  }

  /**
   * Adds cookies to the provided headers as array. Does nothing if there are no cookies stored.
   * This call checks expiration dates and does not add expired cookies.
   * @param headers
   */
  public composeRequest(headers: { Cookie: undefined | string }) {
    if (Object.keys(this.cookies).length === 0) return;
    headers.Cookie = this.toString();
  }

  /**
   *
   * @return {String} cookies as 'name=value' pairs joined by semicolon
   */
  public toString() {
    return Object.keys(this.cookies)
      .filter(this.checkNotExpired.bind(this))
      .map(name => `${name}=${this.cookies[name].value}`)
      .join(';');
  }
}
