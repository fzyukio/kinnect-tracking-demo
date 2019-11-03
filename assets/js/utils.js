/* eslint-disable no-unused-lets */
require('jquery.browser');
require('jquery-getscrollbarwidth');
require('devtools-detect');

export const debug = function (str) {
    if (window.PRINT_DEBUG) {

        // Get the origin of the call. To print out the devtool window for make it easy to jump right to the caller
        let stack = new Error().stack;

        // Why 2? The first line is always "Error", the second line is this debug function, the third is the caller.
        let where = stack.split('\n')[2];

        // eslint-disable-next-line
        console.log(`${str}\t\t\t${where}`);
    }
};


export const logError = function(err) {
    // eslint-disable-next-line
    console.log(err);
};

jQuery.fn.selectText = function () {
    let doc = document;
    let element = this[0];
    let range, selection;

    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    }
    else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

export const getCache = function (cache, key = undefined) {
    if (isNull(key)) {
        return window.appCache[cache];
    }
    else {
        if (isNull(window.appCache[cache])) {
            return undefined;
        }
        return window.appCache[cache][key];
    }
};

/**
 * Return django static urls by their names.
 * @param name named url
 * @param arg parameter, if required
 * @return {string}
 */
export const getUrl = function (name, arg) {
    let url = getCache('urls', name);
    if (arg) {
        url = url.replace('arg', arg);
    }
    return url;
};


/**
 * For embedded URL we're using Markdown's pattern, e.g. [http://www.example.com](example.com)
 * e.g. file_duration:(<3.5) (meaning that filter out any file that has duration > 3.5 sec)
 * @type {RegExp}
 */
const urlRegex = /\[(.*)]\((.*)\)/;


/**
 * A more consistent way to check for being null
 * @param val
 * @returns {boolean} true if is either undefined or null
 */
export const isNull = function (val) {
    return val === undefined || val === null;
};


export const getValue = function (obj, attr, def) {
    let val = obj[attr];
    if (val === undefined) {
        return def;
    }
    return val;
};


const CHARS = '0123456789ABCDEF'.split('');
const FORMAT = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.split('');

/* eslint-disable no-bitwise */
/**
 * Generate a uuid4
 * @returns {string}
 */
export const uuid4 = function () {
    let c = CHARS;
    let id = FORMAT;
    let r;

    id[0] = c[(r = Math.random() * 0x100000000) & 0xf];
    id[1] = c[(r >>>= 4) & 0xf];
    id[2] = c[(r >>>= 4) & 0xf];
    id[3] = c[(r >>>= 4) & 0xf];
    id[4] = c[(r >>>= 4) & 0xf];
    id[5] = c[(r >>>= 4) & 0xf];
    id[6] = c[(r >>>= 4) & 0xf];
    id[7] = c[(r >>>= 4) & 0xf];

    id[9] = c[(r = Math.random() * 0x100000000) & 0xf];
    id[10] = c[(r >>>= 4) & 0xf];
    id[11] = c[(r >>>= 4) & 0xf];
    id[12] = c[(r >>>= 4) & 0xf];
    id[15] = c[(r >>>= 4) & 0xf];
    id[16] = c[(r >>>= 4) & 0xf];
    id[17] = c[(r >>>= 4) & 0xf];

    id[19] = c[(r = Math.random() * 0x100000000) & 0x3 | 0x8];
    id[20] = c[(r >>>= 4) & 0xf];
    id[21] = c[(r >>>= 4) & 0xf];
    id[22] = c[(r >>>= 4) & 0xf];
    id[24] = c[(r >>>= 4) & 0xf];
    id[25] = c[(r >>>= 4) & 0xf];
    id[26] = c[(r >>>= 4) & 0xf];
    id[27] = c[(r >>>= 4) & 0xf];

    id[28] = c[(r = Math.random() * 0x100000000) & 0xf];
    id[29] = c[(r >>>= 4) & 0xf];
    id[30] = c[(r >>>= 4) & 0xf];
    id[31] = c[(r >>>= 4) & 0xf];
    id[32] = c[(r >>>= 4) & 0xf];
    id[33] = c[(r >>>= 4) & 0xf];
    id[34] = c[(r >>>= 4) & 0xf];
    id[35] = c[(r >>>= 4) & 0xf];

    return id.join('');
};


/**
 * A do nothing function
 */
export const noop = function () {
    return undefined;
};


export const getGetParams = function() {
    let args = window.location.search.substr(1);
    let argDict = {};
    $.each(args.split('&'), function(idx, arg) {
        if (arg !== '') {
            let argPart = arg.split('=');
            argDict[argPart[0]] = argPart[1];
        }
    });

    return argDict;
};


/**
 * Assert two arrays are equal
 * @param x
 * @param y
 */
function assertEqualLength(x, y) {
    let len = x.length;
    if (len !== y.length) {
        throw Error('Two arrays must have the same length');
    }
    return len;
}
