/* eslint global-require: off */
/* global keyboardJS */

let Urls = window.Urls;
export {
    Urls,
};

Promise.config({
    cancellation: true
});

/**
 * Replace native Promise with BlueBird's Promise. BB's has cancellation capability and it is also much faster.
 * See https://softwareengineering.stackexchange.com/a/279003 and
 * https://github.com/petkaantonov/bluebird/tree/master/benchmark
 */
window.Promise = Promise;

import {isNull, getGetParams, logError, uuid4} from './utils';
require('no-going-back');

let page;

const inputText = $('<input type="text" class="form-control"/>');
const inputSelect = $('<select class="selectize" ></select>');

const dialogModal = $('#dialog-modal');
const dialogModalTitle = dialogModal.find('.modal-title');
const dialogModalBody = dialogModal.find('.modal-body');
const dialogModalOkBtn = dialogModal.find('#dialog-modal-yes-button');
const dialogModalCancelBtn = dialogModal.find('#dialog-modal-no-button');
const alertSuccess = $('.alert-success');
const alertFailure = $('.alert-danger');

let $modal = $('#upload-csv-modal');
let uploadForm = $modal.find('#file-upload-form');

let argDict = getGetParams();

const commonElements = {
    inputText,
    inputSelect,
    dialogModal,
    dialogModalTitle,
    dialogModalBody,
    dialogModalOkBtn,
    dialogModalCancelBtn,
    alertSuccess,
    alertFailure,
    argDict
};


/**
 * If user uses keyboard shortcut to open the modal, restore the element that was focused before the modal was opened
 */
const restoreModalAfterClosing = function () {

    dialogModal.on('hidden.bs.modal', function () {
        // Restore keyboard navigation to the grid
        $($('div[hidefocus]')[0]).focus();
    });

};


/**
 * Mobile viewport height after orientation change
 * See: https://stackoverflow.com/questions/12452349/mobile-viewport-height-after-orientation-change
 * Wait until innerheight changes, for max 120 frames
 */
function viewPortChangeHandler() {
    const timeout = 120;
    return new window.Promise(function (resolve) {
        const go = (i, height0) => {
            window.innerHeight != height0 || i >= timeout ?
                resolve() :
                window.requestAnimationFrame(() => go(i + 1, height0));
        };
        go(0, window.innerHeight);
    });
}


/**
 * Put everything you need to run before the page has been loaded here
 * @private
 */
const _preRun = function () {
    restoreModalAfterClosing();
    initChangeArgSelections();
    appendGetArguments();

    $('.alert .close').on('click', function () {
        let alertEl = $(this).parent();
        let timerId = alertEl.attr('timer-id');
        clearTimeout(timerId);
        alertEl.hide();
    });

    const viewPortChangeCallback = function () {
        viewPortChangeHandler().then(function () {
            if (!isNull(page) && typeof page.viewPortChangeHandler === 'function') {
                page.viewPortChangeHandler();
            }
        });
    };

    window.addEventListener('orientationchange', viewPortChangeCallback);
    window.addEventListener('resize', viewPortChangeCallback);

    return Promise.resolve();
};


/**
 * If there is a timer, count down to 0 and redirect
 */
const countDown = function () {
    const timer = document.getElementById('countdown-redirect');
    if (timer) {
        const redirect = timer.getAttribute('url');
        let count = parseInt(timer.getAttribute('count'));

        setInterval(function () {
            count--;
            timer.innerHTML = count;
            if (count === 0) {
                window.location.href = redirect;
            }
        }, 1000);
    }
};


/**
 * For all selectable options that will change GET arguments and reload the page, e.g. viewas, database, ...
 * append existing arguments to their bare links.
 * Accept 'internal' arguments, but exclude 'external' type arguments
 * Internal arguments are meant for only a specific page. They shouldn't be appended to links to different page
 * External arguments are meant to trigger some specific functions of a page. They shouldn't be propagated even to
 * links to the same page.
 */
const initChangeArgSelections = function () {
    let locationOrigin = window.location.origin;
    let localtionPath = window.location.pathname;

    $('.change-arg').click(function (e) {
        e.preventDefault();
        argDict[this.getAttribute('key')] = this.getAttribute('value');
        let replace = this.getAttribute('replace');
        if (!isNull(replace)) {
            delete argDict[replace];
        }

        let argString = '?';
        $.each(argDict, function (k, v) {
            if (!k.startsWith('__')) {
                argString += `${k}=${v}&`;
            }
        });
        let newUrl = `${locationOrigin}${localtionPath}${argString}`;
        let quiet = $(this).hasClass('quiet');
        if (quiet) {
            window.history.pushState('', '', newUrl);
        }
        else {
            window.location.href = newUrl;
        }
    });
};


/**
 * Search for all "appendable urls" and append the GET arguments to them.
 * Except 'internal' and 'external' arguments.
 * Internal arguments are meant for only a specific page. They shouldn't be appended to links to different page
 * External arguments are meant to trigger some specific functions of a page. They shouldn't be propagated even to
 * links to the same page.
 *
 * E.g. the current url is localhost/blah?x=1&y=3
 * A clickable URL to localhost/foo will be changed to localhost/foo?x=1&y=3
 */
const appendGetArguments = function () {
    $('a.appendable').each(function (idx, a) {
        let href = a.getAttribute('href');
        let argsStart = href.indexOf('?');

        let argString = '?';
        $.each(argDict, function (k, v) {
            if (!k.startsWith('_')) {
                argString += `${k}=${v}&`;
            }
        });

        if (argsStart > -1) {
            href = href.substr(argsStart);
        }
        a.setAttribute('href', href + argString);
    });
};


/**
 * Put everything you need to run after the page has been loaded here
 */
const _postRun = function () {
    $('.btn[url]').on('click', function (e) {
        e.preventDefault();
        window.location = this.getAttribute('url');
    });
    initButtonBehaviour();
    countDown();
};

const showErrorDialog = function (errMsg) {
    dialogModalTitle.html('Oops, something\'s not right');

    dialogModalBody.children().remove();
    dialogModalBody.append(`<div>${errMsg}</div>`);
    dialogModal.modal('show');

    dialogModalCancelBtn.html('Dismiss');
    dialogModalOkBtn.parent().hide();
    dialogModal.on('hidden.bs.modal', function () {
        dialogModalOkBtn.parent().show();
        dialogModalCancelBtn.html('No');
    });
};


/**
 * Make <button>s function like <a>s
 */
function initButtonBehaviour() {
    $('button[href]').click(function (e) {
        e.preventDefault();
        let url = this.getAttribute('href');
        if (url) {
            window.location = url;
        }
    });
}


const openNewWindow = window.open;

/**
 * Replace open() with a version that can detect popup blocker, and displays the message in that case
 * @param urlToOpen
 */
window.open = function (urlToOpen) {
    let popupWindow = openNewWindow(urlToOpen, uuid4(), '');
    try {
        popupWindow.focus();
    }
    catch (e) {
        let errMsg = `
            <p>Mainapp was prevented from opening a new window to <a href="${urlToOpen}">${urlToOpen}</a> by your browser.</p>
            <p>Please whitelist this website in <strong>Pop-ups and Redirects</strong> settings.</p>`;
        showErrorDialog(errMsg);
    }
};


/**
 * Loading the page by URL's location, e.g localhost:8000/herd-allocation
 */
$(document).ready(function () {
    let windowWith = $(window).width();
    if (windowWith < 576) {
        $('#content-wrapper').removeClass('toggled').addClass('not-toggled');
    }

    $('[data-toggle="tooltip"]').tooltip();

    let pageName = location.pathname;
    if (pageName === '/jun/') {
        page = require('jun-page');
    }

    let runPage = function () {
        if (isNull(page)) {
            return Promise.resolve();
        }
        else {
            let preRun = page.preRun || (() => Promise.resolve());

            return preRun(commonElements).then(function () {
                return page.run(commonElements).then(function () {
                    if (typeof page.postRun == 'function') {
                        return page.postRun();
                    }
                    return Promise.resolve();
                });
            });
        }
    };

    _preRun().then(function () {
        return runPage();
    }).then(function () {
        return _postRun();
    }).catch(function (e) {
        logError(e);
        showErrorDialog(e);
    });

});

