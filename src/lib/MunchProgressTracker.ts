/**
 * Tracks progress across a whole munch run, not just the current batch.
 *
 * Factories process documents in batches of 100, in two phases: parse, then
 * import into the compendium. Each document contributes half a unit per phase so
 * the overall bar keeps moving during the (slow) parse phase instead of stalling
 * until documents start landing in the compendium.
 *
 * Progress is monotonic: it never moves backwards, and snapping at batch
 * boundaries keeps it aligned with real document counts even when a batch is
 * culled (e.g. existing documents removed when not updating).
 */
export default class MunchProgressTracker {

  /** Total documents in the run. Zero until the source data has been fetched. */
  total: number;

  /** Documents processed so far, in fractional units of half a document. */
  processed: number;

  constructor(total = 0) {
    this.total = total;
    this.processed = 0;
  }

  /** True once a run total is known, and there is something to report. */
  get active(): boolean {
    return this.total > 0;
  }

  /** Whole documents processed so far, clamped to the run total. */
  get current(): number {
    return Math.min(Math.round(this.processed), this.total);
  }

  /** Reset for a fresh run of a known size. */
  start(total: number): void {
    this.total = total;
    this.processed = 0;
  }

  /**
   * Record half a document of work, one phase of one document.
   */
  advanceHalf(): void {
    this.processed = Math.min(this.processed + 0.5, this.total);
  }

  /**
   * Align with an exact document count at a batch boundary. Never moves
   * backwards, so a batch that had documents culled before import cannot leave
   * the bar short.
   * @param {number} documents documents completed at this point in the run
   */
  snapTo(documents: number): void {
    this.processed = Math.min(Math.max(this.processed, documents), this.total);
  }

  /** Mark the run as complete. */
  finish(): void {
    this.processed = this.total;
  }

  /**
   * Build the notifier payload for the overall progress bar.
   * @param {string} message text to show above the bar
   * @param {boolean} clear hide the bar after updating it
   * @returns {NotifierV2Props} payload for a notifierV2 call
   */
  payload(message = "", clear = false): NotifierV2Props {
    return {
      progress: { current: this.current, total: this.total },
      section: "overall",
      message,
      progressBar: "overall",
      suppress: true,
      clear,
    };
  }

}
