export interface IEvent {
    timestamp: number;
    sessionId: string;
    siteName: string;
    timeOnPage: number;
    username: string;
    eventType: string;
    hostname: string;
    pathname: string;
    search: string;
    inFocus: boolean;
    timeAtFocusState: number;
    priorHostname?: string;
    priorPathname?: string;
    priorSearch?: string;
}
export interface IConstructorOptions {
    siteName: string;
    server: string;
    usernameHeader?: string;
}
declare class Hoppler {
    /**
     * STATE VARIABLES
     */
    private username;
    private hopplerServer;
    private siteName;
    private isFocused;
    private currentHostname;
    private currentPathname;
    private currentSearch;
    private pageArrival;
    private focusStateTime;
    private sessionId;
    private usernameHeader;
    private eventCache;
    private lastFlush;
    private lastEntry;
    private flushRetries;
    /**
     * Misc variables
     */
    private pollerTimeout;
    private isFlushing;
    constructor(config: IConstructorOptions);
    /**
     * Start or resume a session.  First, let's start tracking the current page.  Then, see if we
     * have a session stored in the session storage.  If so, we resume that session.  Else, we
     * create a new session.
     */
    private startOrResumeSession;
    /**
     * Create an entry event and store it in the cache.
     * @param eventType the type of event to create
     * @param priorHostname (optional) the prior hostname if this is a page transition
     * @param priorPathname (optional) the prior pathname if this is a page transition
     * @param priorSearch (optional) the prior search if this is a page transition
     */
    private createEventEntry;
    /**
     * This is the main function that gets pinged at the rate of PING_FREQ.  It will see if the page
     * changed or stayed the same and create the appropriate event.  And it will see if it is time
     * to flush the cache.
     */
    private masterPing;
    /**
     * Create an entry when the page gets focused
     */
    private handleOnFocus;
    /**
     * Create an entry when the page loses focus
     */
    private handleOnBlur;
    /**
     * Compress the number of events by getting rid of redundant "still-on-page" sequential events
     * and rolling them up into on a single event with an accurate time summation
     */
    private compressEvents;
    private flushEventsToServer;
}
export { Hoppler };
