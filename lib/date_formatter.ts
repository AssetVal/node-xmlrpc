type DateFormatterOptions = { colons?: boolean; hyphens?: boolean; local?: boolean; ms?: boolean; offset?: boolean };

/**
 * @class DateFormatter
 * The DateFormatter supports decoding from and encoding to ISO8601 formatted strings.
 * Accepts formats with and without hyphen/colon separators and correctly parses zoning info.
 */
class DateFormatter {
  DEFAULT_OPTIONS: Record<keyof DateFormatterOptions, boolean> = {
    colons: true,
    hyphens: false,
    local: true,
    ms: false,
    offset: false
  };
  options: DateFormatterOptions = { ...this.DEFAULT_OPTIONS };

  /** Regular Expression that dissects ISO 8601 formatted strings into an array */
  ISO8601 = new RegExp(
    '([0-9]{4})([-]?([0-9]{2}))([-]?([0-9]{2}))' +
      '(T([0-9]{2})(((:?([0-9]{2}))?((:?([0-9]{2}))?(.([0-9]+))?))?)' +
      '(Z|([+-]([0-9]{2}(:?([0-9]{2}))?)))?)?'
  );

  constructor(opts?: DateFormatterOptions) {
    this.setOpts(opts);
  }

  /**
   * Sets options for encoding Date objects to ISO8601 strings.
   * Omitting the 'opts' argument will reset all options to the default.
   *
   * @example
   * dateFormatter.setOpts({
   *   colons: false, // Enable/disable formatting the time portion with a colon as separator (default: true)
   *   hyphens: true, // Enable/disable formatting the date portion with hyphens as separators (default: false)
   *   local: false, // Enable/disable local time instead of UTC (default: true)
   *   ms: true, // Enable/disable output of milliseconds (default: false)
   *   offset: true // Enable/disable output of UTC offset (default: false)
   * });
   */
  setOpts(opts?: DateFormatterOptions) {
    if (!opts) opts = this.DEFAULT_OPTIONS;
    this.options = { ...this.DEFAULT_OPTIONS, ...opts };
  }

  /** Converts a date time stamp following the ISO8601 format to a JavaScript Date */
  decodeIso8601(time: string) {
    const dateParts = time.toString().match(this.ISO8601);

    if (!dateParts) throw new Error(`Expected a ISO8601 date time but got '${time}'`);

    let date = [
      [dateParts[1], dateParts[3] || '01', dateParts[5] || '01'].join('-'),
      'T',
      [dateParts[7] || '00', dateParts[11] || '00', dateParts[14] || '00'].join(':'),
      '.',
      dateParts[16] || '000'
    ].join('');

    date +=
      dateParts[17] !== undefined
        ? dateParts[17] + (dateParts[19] && dateParts[20] === undefined ? '00' : '')
        : this.formatCurrentOffset(new Date(date));

    return new Date(date);
  }

  /** Converts a JavaScript Date object to an ISO8601 timestamp */
  encodeIso8601(date: Date) {
    const parts = this.options.local ? this.getLocalDateParts(date) : this.getUTCDateParts(date);

    return [
      [parts[0], parts[1], parts[2]].join(this.options.hyphens ? '-' : ''),
      'T',
      [parts[3], parts[4], parts[5]].join(this.options.colons ? ':' : ''),
      this.options.ms ? `.${parts[6]}` : '',
      // eslint-disable-next-line no-nested-ternary
      this.options.local ? (this.options.offset ? this.formatCurrentOffset(date) : '') : 'Z'
    ].join('');
  }

  /** Helper function to get an array of zero-padded date parts, in UTC */
  getUTCDateParts(date: Date): Array<string> {
    return [
      date.getUTCFullYear().toString(),
      this.zeroPad(date.getUTCMonth() + 1, 2),
      this.zeroPad(date.getUTCDate(), 2),
      this.zeroPad(date.getUTCHours(), 2),
      this.zeroPad(date.getUTCMinutes(), 2),
      this.zeroPad(date.getUTCSeconds(), 2),
      this.zeroPad(date.getUTCMilliseconds(), 3)
    ];
  }

  /**
   * Helper function to get an array of zero-padded date parts,
   * in the local time zone
   *
   * @param {Date} date - Date Object
   * @return {String[]}
   */
  getLocalDateParts(date: Date): Array<string> {
    return [
      date.getFullYear().toString(),
      this.zeroPad(date.getMonth() + 1, 2),
      this.zeroPad(date.getDate(), 2),
      this.zeroPad(date.getHours(), 2),
      this.zeroPad(date.getMinutes(), 2),
      this.zeroPad(date.getSeconds(), 2),
      this.zeroPad(date.getMilliseconds(), 3)
    ];
  }

  /** Helper function to pad the digits with 0s to meet date formatting requirements. */
  zeroPad(digit: number, length: number) {
    let padded = `${digit}`;
    while (padded.length < length) {
      padded = `0${padded}`;
    }

    return padded;
  }

  /**
   * Helper function to get the current timezone to default decoding to rather than UTC. (for backward compatibility)
   * @return {String} - in the format /Z|[+-]\d{2}:\d{2}/
   */
  formatCurrentOffset(d?: Date) {
    const offset = (d || new Date()).getTimezoneOffset();
    return offset !== 0
      ? [
          offset < 0 ? '+' : '-',
          this.zeroPad(Math.abs(Math.floor(offset / 60)), 2),
          ':',
          this.zeroPad(Math.abs(offset % 60), 2)
        ].join('')
      : 'Z';
  }
}

// export an instance of DateFormatter only.
export default new DateFormatter();
