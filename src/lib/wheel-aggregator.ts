/**
 * This is old but I found it when looking for an answer to pretty much the same problem.
 * I solved the problem for my purposes, so here's my solution in case it helps anyone else.
 *
 * The problem is really to define what counts as one continuous action. Without something
 * more concrete to work with, it's just a question of timing. It's the time between events
 * that's the key - so the algorithm is to keep accumulating events until there's a certain
 * gap between them. All that then remains is to figure out how big the allowed gap should be,
 * which is solution specific. That's then the maximum delay after the user stops scrolling
 * until they get feedback. My optimum is a quarter of a second, I'm using that as a default
 * in the below.
 *
 * @description https://stackoverflow.com/a/63747787/10767294
 */

export class WheelEventAggregator {
  private maxAllowedPause: number;
  private lastEvent: number;
  private cumulativeDeltaX: number;
  private timer?: NodeJS.Timeout;
  private eventCallback: (deltaX: number) => void;

  constructor(callback: (deltaX: number) => void, maxPause = 250) {
    this.maxAllowedPause = maxPause;
    this.lastEvent = Date.now();
    this.cumulativeDeltaX = 0;
    this.eventCallback = callback;
  }

  handleEvent(e: WheelEvent) {
    const elapsed = Date.now() - this.lastEvent;
    this.lastEvent = Date.now();

    if (this.cumulativeDeltaX === 0 || elapsed < this.maxAllowedPause) {
      this.cumulativeDeltaX += e.deltaX;
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.fireAggregateEvent(), this.maxAllowedPause);
    } else {
      this.fireAggregateEvent();
    }
  }

  private fireAggregateEvent() {
    if (this.timer) clearTimeout(this.timer);
    const deltaX = this.cumulativeDeltaX;
    this.cumulativeDeltaX = 0;
    this.timer = undefined;

    if (Math.abs(deltaX) > 20) {
      this.eventCallback(deltaX);
    }
  }
}
