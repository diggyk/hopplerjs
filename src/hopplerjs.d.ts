export interface IEvent {
    timestamp: number;
    sessionId: string;
    timeOnPage: number;
    username: string;
    eventType: string;
    hostname: string;
    pathname: string;
    search: string;
    inFocus: boolean;
    priorHostname?: string;
    priorPathname?: string;
    priorSearch?: string;
}
declare class Hoppler {
    /**
     * STATE VARIABLES
     */
    private username;
    private isFocused;
    private currentHostname;
    private currentPathname;
    private currentSearch;
    private pageArrival;
    private sessionId;
    private eventCache;
    private lastFlush;
    private lastEntry;
    /**
     * Misc variables
     */
    private pollerTimeout;
    private isFlushing;
    constructor();
    /**
     * Start or resume a session.  First, let's start tracking the current page.  Then, see if we
     * have a session stored in the session storage.  If so, we resume that session.  Else, we
     * create a new session.
     */
    private startOrResumeSession;
    /**
     * Create an entry event and store it in the cache.
     * @param eventType
     * @param priorHostname
     * @param priorPathname
     * @param priorSearch
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
    private flushEventsToServer;
}
export { Hoppler };
