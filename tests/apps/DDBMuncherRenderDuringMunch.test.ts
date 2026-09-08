// @vitest-environment jsdom
// A render replaces the muncher's DOM and with it the progress overlay, so renders queued behind
// setting writes must wait while a munch is running (or its details overlay is still showing).

import DDBMuncher from "../../src/apps/DDBMuncher";

function makeMuncher(): DDBMuncher {
  const muncher = Object.create(DDBMuncher.prototype) as DDBMuncher;
  // class-field defaults the skipped constructor would have set
  Object.assign(muncher, {
    preMunchHeight: null, pendingSettingUpdates: 0, lastInteractionAt: 0, settingRenderIdleMs: 400,
    controlSettled: false, settingRenderFlushRequested: false,
  });
  // the ApplicationV2 stub exposes element as a getter; the focus check only needs it to be absent
  Object.defineProperty(muncher, "element", { value: null, configurable: true });
  return muncher;
}

describe("DDBMuncher queued renders during a munch", () => {
  it("allows a queued render when idle", () => {
    const muncher = makeMuncher();
    expect(muncher.isMunching).toBe(false);
    expect((muncher as unknown as { canRunQueuedRender: () => boolean }).canRunQueuedRender()).toBe(true);
  });

  it("holds a queued render while the munch overlay is up", () => {
    const muncher = makeMuncher();
    muncher.preMunchHeight = 640;
    expect(muncher.isMunching).toBe(true);
    expect((muncher as unknown as { canRunQueuedRender: () => boolean }).canRunQueuedRender()).toBe(false);
  });

  it("keeps holding through a tab-change flush while munching", () => {
    const muncher = makeMuncher();
    muncher.preMunchHeight = 640;
    Object.assign(muncher, { settingRenderFlushRequested: true });
    expect((muncher as unknown as { canRunQueuedRender: () => boolean }).canRunQueuedRender()).toBe(false);
  });
});
