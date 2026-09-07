// Pins the overall-run progress maths used by the monster and vehicle munch
// bars. The guarantees that matter to the UI are: progress never moves
// backwards, it survives batches whose documents are culled before import, and
// it lands exactly on the run total.

import MunchProgressTracker from "../../src/lib/MunchProgressTracker";

describe("MunchProgressTracker", () => {

  it("is inactive until a run total is known", () => {
    const tracker = new MunchProgressTracker();
    expect(tracker.active).toBe(false);
    expect(tracker.total).toBe(0);

    tracker.start(10);
    expect(tracker.active).toBe(true);
  });

  it("counts two halves per document, one per phase", () => {
    const tracker = new MunchProgressTracker(4);
    tracker.advanceHalf(); // parsed
    expect(tracker.current).toBe(1); // rounds up mid document
    tracker.advanceHalf(); // imported
    expect(tracker.current).toBe(1);
    tracker.advanceHalf();
    tracker.advanceHalf();
    expect(tracker.current).toBe(2);
  });

  it("never moves backwards across a full batched run", () => {
    const total = 250;
    const tracker = new MunchProgressTracker(total);
    const seen: number[] = [];

    for (let batchStart = 0; batchStart < total; batchStart += 100) {
      const batch = Math.min(100, total - batchStart);
      for (let i = 0; i < batch; i++) {
        tracker.advanceHalf();
        seen.push(tracker.current);
      }
      for (let i = 0; i < batch; i++) {
        tracker.advanceHalf();
        seen.push(tracker.current);
      }
      tracker.snapTo(Math.min(batchStart + 100, total));
      seen.push(tracker.current);
    }

    expect(seen.every((v, i) => i === 0 || v >= seen[i - 1])).toBe(true);
    expect(tracker.current).toBe(total);
  });

  it("snaps back up when a batch is culled before import", () => {
    const tracker = new MunchProgressTracker(200);
    // 100 parsed, but only 60 survive to be imported (existing docs skipped)
    for (let i = 0; i < 100; i++) tracker.advanceHalf();
    for (let i = 0; i < 60; i++) tracker.advanceHalf();
    expect(tracker.current).toBe(80);

    tracker.snapTo(100);
    expect(tracker.current).toBe(100);
  });

  it("does not let snapTo drag progress backwards", () => {
    const tracker = new MunchProgressTracker(200);
    for (let i = 0; i < 240; i++) tracker.advanceHalf();
    expect(tracker.current).toBe(120);

    tracker.snapTo(100);
    expect(tracker.current).toBe(120);
  });

  it("clamps to the run total", () => {
    const tracker = new MunchProgressTracker(3);
    for (let i = 0; i < 20; i++) tracker.advanceHalf();
    expect(tracker.current).toBe(3);

    tracker.snapTo(500);
    expect(tracker.current).toBe(3);
  });

  it("finishes on the total", () => {
    const tracker = new MunchProgressTracker(42);
    tracker.advanceHalf();
    tracker.finish();
    expect(tracker.current).toBe(42);
  });

  it("builds an overall bar payload", () => {
    const tracker = new MunchProgressTracker(10);
    tracker.advanceHalf();
    tracker.advanceHalf();

    expect(tracker.payload("parsing monsters")).toEqual({
      progress: { current: 1, total: 10 },
      section: "overall",
      message: "parsing monsters",
      progressBar: "overall",
      suppress: true,
      clear: false,
    });

    expect(tracker.payload("", true).clear).toBe(true);
  });

  it("reports zero progress for an empty run without dividing by zero", () => {
    const tracker = new MunchProgressTracker(0);
    tracker.advanceHalf();
    expect(tracker.current).toBe(0);
    expect(tracker.payload("nothing").progress).toEqual({ current: 0, total: 0 });
  });

});
