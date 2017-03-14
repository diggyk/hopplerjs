import {generateSessionId} from "./utils";

export interface IEvent {
    timestamp:number,
    sessionId:string,
    siteName:string,
    timeOnPage:number,
    username:string,
    eventType:string,
    hostname:string,
    pathname:string
    search:string,
    inFocus:boolean,
    timeAtFocusState:number,
    priorHostname?:string,
    priorPathname?:string,
    priorSearch?:string,
}

/** CONFIG VARIABLES **/
// how often we create an entry when nothing of note has happened (in seconds)
const KEEP_ALIVE_FREQ = 5;

// how often we ping to see things have changed (in seconds)
const PING_FREQ = 1;

// how often we want to flush the cache to the Hoppler service (in seconds)
const FLUSH_FREQ = 30;

class Hoppler {
    /**
     * STATE VARIABLES
     */
    private username:string = 'unknown';
    private siteName:string;
    private isFocused:boolean;
    private currentHostname:string;
    private currentPathname:string;
    private currentSearch:string;
    private pageArrival:number;
    private focusStateTime:number;
    private sessionId:string;

    private eventCache:Array<IEvent> = [];
    private lastFlush:number = 0;
    private lastEntry:number = 0;

    /**
     * Misc variables
     */
    private pollerTimeout:number;
    private isFlushing:boolean;

    constructor(siteName:string) {
        console.log(`Hoppler(${siteName})`);

        if (!siteName) {
            console.error('Must specify site name when instantiating HopplerJS.');
            return;
        }

        this.siteName = siteName;

        this.pollerTimeout = window.setInterval(this.masterPing, PING_FREQ * 1000);

        window.onfocus = this.handleOnFocus;
        window.onblur = this.handleOnBlur;

        this.startOrResumeSession();
    }

    /**
     * Start or resume a session.  First, let's start tracking the current page.  Then, see if we
     * have a session stored in the session storage.  If so, we resume that session.  Else, we
     * create a new session.
     */
    private startOrResumeSession = () => {
        this.currentHostname = window.location.hostname;
        this.currentPathname = window.location.pathname;
        this.currentSearch = window.location.search;
        this.pageArrival = new Date().getTime();
        this.focusStateTime = this.pageArrival;
        this.lastFlush = this.pageArrival;

        // load session id if found in localstorage/cookie and is recent
        // else, create a store a new session id
        this.sessionId = sessionStorage.getItem('hplrSn');
        let sessionLastTimestamp = parseInt(sessionStorage.getItem('hplrLt'));
        if (
            !this.sessionId
                || !sessionLastTimestamp
                || this.pageArrival - sessionLastTimestamp > 300000
        ) {
            this.sessionId = generateSessionId();
            console.log(`Creating a new session: ${this.sessionId}`);
            sessionStorage.setItem('hplrSn', this.sessionId);
            this.createEventEntry('sessionStart');
        } else {
            console.log(`Picking back up with session ${this.sessionId}`);
            this.createEventEntry('sessionResume');
        }

        console.log(document.referrer);
        console.log(document);
    };

    /**
     * Create an entry event and store it in the cache.
     * @param eventType the type of event to create
     * @param priorHostname (optional) the prior hostname if this is a page transition
     * @param priorPathname (optional) the prior pathname if this is a page transition
     * @param priorSearch (optional) the prior search if this is a page transition
     */
    private createEventEntry = (eventType:string,
                                priorHostname:string = null,
                                priorPathname:string = null,
                                priorSearch:string = null) => {
        let hostname = window.location.hostname;
        let pathname = window.location.pathname;
        let search = window.location.search;

        this.isFocused = document.hasFocus();

        let timestamp = new Date().getTime();
        let timeOnPage = timestamp - this.pageArrival;
        let timeAtFocusState = timestamp - this.focusStateTime;

        let event = {
            hostname,
            pathname,
            priorHostname,
            priorPathname,
            priorSearch,
            search,
            timestamp,
            timeOnPage,
            timeAtFocusState,
            eventType: eventType,
            inFocus: this.isFocused,
            sessionId: this.sessionId,
            siteName: this.siteName,
            username: this.username,
        };

        // track when this entry was created b/c we want entries every so often (KEEP_ALIVE_FREQ)
        this.lastEntry = timestamp;

        this.eventCache.push(event);
    };

    /**
     * This is the main function that gets pinged at the rate of PING_FREQ.  It will see if the page
     * changed or stayed the same and create the appropriate event.  And it will see if it is time
     * to flush the cache.
     */
    private masterPing = () => {
        if (
            this.currentHostname != window.location.hostname
            || this.currentPathname != window.location.pathname
            || this.currentSearch != window.location.search
        ) {
            let priorHostname = this.currentHostname;
            let priorPathname = this.currentPathname;
            let priorSearch = this.currentSearch;

            this.currentHostname = window.location.hostname;
            this.currentPathname = window.location.pathname;
            this.currentSearch = window.location.search;

            this.pageArrival = new Date().getTime();

            this.createEventEntry('pageArrival', priorHostname, priorPathname, priorSearch);
        } else if ((new Date().getTime() - this.lastEntry) / 1000 > KEEP_ALIVE_FREQ) {
            this.createEventEntry('stillOnPage');
        }

        if ((new Date().getTime() - this.lastFlush) / 1000 > FLUSH_FREQ) this.flushEventsToServer();
    };

    /**
     * Create an entry when the page gets focused
     */
    private handleOnFocus = () => {
        // we only create an entry if didn't think the page had focus prior to this event
        if (!this.isFocused) {
            this.focusStateTime = new Date().getTime();
            this.createEventEntry('pageFocus');
        }
    };

    /**
     * Create an entry when the page loses focus
     */
    private handleOnBlur = () => {
        // we only create an entry if we thought the page had focus prior to this event
        if (this.isFocused) {
            this.focusStateTime = new Date().getTime();
            this.createEventEntry('pageBlur');
        }
    };

    /**
     * Compress the number of events by getting rid of redundant "still-on-page" sequential events
     * and rolling them up into on a single event with an accurate time summation
     */
    private compressEvents = () => {
        let index = 0;
        while (index < this.eventCache.length) {
            let event = this.eventCache[index];

            // if this isn't a 'stillOnPage' event, move on to the next one
            if (event.eventType != 'stillOnPage') {
                ++index;
                continue;
            }

            // no more events to process
            if (index + 1 >= this.eventCache.length) break;

            // see if the next event is a 'stillOnPage' event; if so, compress; otherwise, move forward
            let nextEvent = this.eventCache[index + 1];
            if (nextEvent.eventType != 'stillOnPage') {
                ++index;
                continue;
            } else {
                // combine the time-on-page values
                event.timeOnPage = nextEvent.timeOnPage;
                event.timeAtFocusState = nextEvent.timeAtFocusState;

                // pull out and discard the next event (which we just combined into this one)
                this.eventCache.splice(index, 1);

                // NOTE: we do not update the index b/c we want to see if the new next event can be compressed
            }
        }
    };

    private flushEventsToServer = () => {
        if (this.isFlushing) {
            console.log('Do nothing (already flushing)');
            return;
        }

        this.isFlushing = true;
        this.compressEvents();

        console.log(`Flushing ${this.eventCache.length} events`);

        let flushCall = fetch('http://localhost:8000/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({events: this.eventCache})
            });

        this.eventCache.forEach((e:IEvent) => {
            console.log(e.timeOnPage);
        });

        flushCall.then((response) => {
            console.log("Flushed");
            this.isFlushing = false;
            this.lastFlush = new Date().getTime();
            this.eventCache = [];

            // store the last flush time in the local session so if the page is reloaded, we know
            // how to tell if this session is still fresh or stale
            sessionStorage.setItem('hplrLt', this.lastFlush.toString());
        }).catch(() => {
            console.log("Flushing failed");
            this.isFlushing = false;
        })
    }
}

export {Hoppler};

declare let _hplr:{[key:string]:string};
let hoppler:Hoppler = null;

try {
    if (_hplr !== undefined && 'autostart' in _hplr) {
        console.log("Detected HopplerJS autostart.");
        if (_hplr['siteName']) {
            hoppler = new Hoppler(_hplr['siteName']);
        } else {
            console.error('Must specify _hplr[\'siteName\'] to instantiate HopplerJS.');
        }
    }
} catch(e) {
    console.log("HopplerJS must be instantiated programmatically");
}
