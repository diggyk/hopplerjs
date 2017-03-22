(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function generateSessionId() {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = 0; i < 8; i++)
        result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
exports.generateSessionId = generateSessionId;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = __webpack_require__(0);
/** CONFIG VARIABLES **/
// how often we create an entry when nothing of note has happened (in seconds)
var KEEP_ALIVE_FREQ = 5;
// how often we ping to see things have changed (in seconds)
var PING_FREQ = 1;
// how often we want to flush the cache to the Hoppler service (in seconds)
var FLUSH_FREQ = 30;
var Hoppler = (function () {
    function Hoppler(config) {
        // console.log(`Hoppler(${config.siteName})`);
        var _this = this;
        /**
         * STATE VARIABLES
         */
        this.username = 'unknown';
        this.eventCache = [];
        this.lastFlush = 0;
        this.lastEntry = 0;
        this.flushRetries = 0;
        /**
         * Start or resume a session.  First, let's start tracking the current page.  Then, see if we
         * have a session stored in the session storage.  If so, we resume that session.  Else, we
         * create a new session.
         */
        this.startOrResumeSession = function () {
            _this.currentHostname = window.location.hostname;
            _this.currentPathname = window.location.pathname;
            _this.currentSearch = window.location.search;
            _this.pageArrival = new Date().getTime();
            _this.focusStateTime = _this.pageArrival;
            _this.lastFlush = _this.pageArrival;
            // load session id if found in localstorage/cookie and is recent
            // else, create a store a new session id
            _this.sessionId = window.sessionStorage.getItem('hplrSn');
            var sessionLastTimestamp = parseInt(window.sessionStorage.getItem('hplrLt'));
            console.log(_this.sessionId + " " + sessionLastTimestamp);
            if (!_this.sessionId
                || !sessionLastTimestamp
                || _this.pageArrival - sessionLastTimestamp > 300000) {
                _this.sessionId = utils_1.generateSessionId();
                // console.log(`Creating a new session: ${this.sessionId}`);
                window.sessionStorage.setItem('hplrSn', _this.sessionId);
                _this.createEventEntry('sessionStart');
            }
            else {
                // console.log(`Picking back up with session ${this.sessionId}`);
                _this.createEventEntry('sessionResume');
            }
            // console.log(document.referrer);
            // console.log(document);
            _this.flushEventsToServer();
        };
        /**
         * Create an entry event and store it in the cache.
         * @param eventType the type of event to create
         * @param priorHostname (optional) the prior hostname if this is a page transition
         * @param priorPathname (optional) the prior pathname if this is a page transition
         * @param priorSearch (optional) the prior search if this is a page transition
         */
        this.createEventEntry = function (eventType, priorHostname, priorPathname, priorSearch) {
            if (priorHostname === void 0) { priorHostname = null; }
            if (priorPathname === void 0) { priorPathname = null; }
            if (priorSearch === void 0) { priorSearch = null; }
            var hostname = window.location.hostname;
            var pathname = window.location.pathname;
            var search = window.location.search;
            _this.isFocused = document.hasFocus();
            var timestamp = new Date().getTime();
            var timeOnPage = timestamp - _this.pageArrival;
            var timeAtFocusState = timestamp - _this.focusStateTime;
            var event = {
                hostname: hostname,
                pathname: pathname,
                priorHostname: priorHostname,
                priorPathname: priorPathname,
                priorSearch: priorSearch,
                search: search,
                timestamp: timestamp,
                timeOnPage: timeOnPage,
                timeAtFocusState: timeAtFocusState,
                eventType: eventType,
                inFocus: _this.isFocused,
                sessionId: _this.sessionId,
                siteName: _this.siteName,
                username: _this.username,
            };
            // track when this entry was created b/c we want entries every so often (KEEP_ALIVE_FREQ)
            _this.lastEntry = timestamp;
            _this.eventCache.push(event);
        };
        /**
         * This is the main function that gets pinged at the rate of PING_FREQ.  It will see if the page
         * changed or stayed the same and create the appropriate event.  And it will see if it is time
         * to flush the cache.
         */
        this.masterPing = function () {
            if (_this.currentHostname != window.location.hostname
                || _this.currentPathname != window.location.pathname
                || _this.currentSearch != window.location.search) {
                var priorHostname = _this.currentHostname;
                var priorPathname = _this.currentPathname;
                var priorSearch = _this.currentSearch;
                _this.currentHostname = window.location.hostname;
                _this.currentPathname = window.location.pathname;
                _this.currentSearch = window.location.search;
                _this.pageArrival = new Date().getTime();
                _this.createEventEntry('pageArrival', priorHostname, priorPathname, priorSearch);
            }
            else if ((new Date().getTime() - _this.lastEntry) / 1000 > KEEP_ALIVE_FREQ) {
                _this.createEventEntry('stillOnPage');
            }
            if ((new Date().getTime() - _this.lastFlush) / 1000 > FLUSH_FREQ)
                _this.flushEventsToServer();
        };
        /**
         * Create an entry when the page gets focused
         */
        this.handleOnFocus = function () {
            // we only create an entry if didn't think the page had focus prior to this event
            if (!_this.isFocused) {
                _this.focusStateTime = new Date().getTime();
                _this.createEventEntry('pageFocus');
            }
        };
        /**
         * Create an entry when the page loses focus
         */
        this.handleOnBlur = function () {
            // we only create an entry if we thought the page had focus prior to this event
            if (_this.isFocused) {
                _this.focusStateTime = new Date().getTime();
                _this.createEventEntry('pageBlur');
            }
        };
        /**
         * Compress the number of events by getting rid of redundant "still-on-page" sequential events
         * and rolling them up into on a single event with an accurate time summation
         */
        this.compressEvents = function () {
            var index = 0;
            while (index < _this.eventCache.length) {
                var event_1 = _this.eventCache[index];
                // if this isn't a 'stillOnPage' event, move on to the next one
                if (event_1.eventType != 'stillOnPage') {
                    ++index;
                    continue;
                }
                // no more events to process
                if (index + 1 >= _this.eventCache.length)
                    break;
                // see if the next event is a 'stillOnPage' event; if so, compress; otherwise, move forward
                var nextEvent = _this.eventCache[index + 1];
                if (nextEvent.eventType != 'stillOnPage') {
                    ++index;
                    continue;
                }
                else {
                    // combine the time-on-page values
                    event_1.timeOnPage = nextEvent.timeOnPage;
                    event_1.timeAtFocusState = nextEvent.timeAtFocusState;
                    // pull out and discard the next event (which we just combined into this one)
                    _this.eventCache.splice(index, 1);
                    // NOTE: we do not update the index b/c we want to see if the new next event can be compressed
                }
            }
        };
        this.flushEventsToServer = function () {
            if (_this.isFlushing) {
                // console.log('Do nothing (already flushing)');
                return;
            }
            _this.isFlushing = true;
            _this.compressEvents();
            // console.log(`Flushing ${this.eventCache.length} events`);
            var url = _this.hopplerServer + "/events";
            if (_this.usernameHeader)
                url += "?uh=" + _this.usernameHeader;
            var flushCall = fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ events: _this.eventCache })
            });
            flushCall.then(function (response) {
                // console.log("Flushed");
                _this.isFlushing = false;
                _this.lastFlush = new Date().getTime();
                _this.flushRetries = 0;
                _this.eventCache = [];
                // store the last flush time in the local session so if the page is reloaded, we know
                // how to tell if this session is still fresh or stale
                window.sessionStorage.setItem('hplrLt', _this.lastFlush.toString());
            }).catch(function () {
                // console.log("Flushing failed");
                setTimeout(function () {
                    _this.flushRetries++;
                    _this.isFlushing = false;
                }, 10000 * (_this.flushRetries < 30 ? _this.flushRetries : 30));
            });
        };
        // ensure the identifying sitename is specified
        if (!config.siteName) {
            console.error('Must specify site name when instantiating HopplerJS.');
            return;
        }
        this.siteName = config.siteName;
        // ensure the hoppler api server is specified
        if (!config.server) {
            console.error('Must specify URL to Hoppler API server.');
            return;
        }
        this.hopplerServer = config.server;
        // see if we need to pass data on how to pull username from headers
        if (config.usernameHeader)
            this.usernameHeader = config.usernameHeader;
        // set the document domain to the top level
        var hostParts = location.hostname.split('.').reverse();
        if (hostParts.length > 1)
            document.domain = hostParts[1] + "." + hostParts[0];
        this.pollerTimeout = window.setInterval(this.masterPing, PING_FREQ * 1000);
        window.onfocus = this.handleOnFocus;
        window.onblur = this.handleOnBlur;
        this.startOrResumeSession();
    }
    return Hoppler;
}());
exports.Hoppler = Hoppler;
var hoppler = null;
try {
    if (_hplr !== undefined && 'autostart' in _hplr) {
        console.log("Detected HopplerJS autostart.");
        if (_hplr['siteName'] && _hplr['server']) {
            var config = {
                siteName: _hplr['siteName'],
                server: _hplr['server']
            };
            if (_hplr['usernameHeader'])
                config['usernameHeader'] = _hplr['usernameHeader'];
            hoppler = new Hoppler(config);
        }
        else {
            console.error('Must specify _hplr[\'siteName\'] and _hplr[\'server\'] to instantiate HopplerJS.');
        }
    }
}
catch (e) {
    console.log("HopplerJS must be instantiated programmatically");
}


/***/ })
/******/ ]);
});