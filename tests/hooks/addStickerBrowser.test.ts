import { setMockSettings } from "../_setup/foundryMocks";

// DDBStickerBrowser pulls in DDBAppV2 (and via the key change dialog, the whole
// Muncher), none of which load under the node test environment. The hook's job
// is only to consult hasAccess() and wire onChange, so stub both.
const hasAccess = vi.fn<() => boolean>();
const open = vi.fn<() => Promise<null>>();

vi.mock("../../src/apps/DDBStickerBrowser", () => ({
  default: {
    get hasAccess() {
      return hasAccess;
    },
    get open() {
      return open;
    },
  },
}));

const { addStickerBrowserControl } = await import("../../src/hooks/getSceneControlButtons/addStickerBrowser");

function emptyControls(): Record<string, any> {
  return { tiles: { name: "tiles", tools: {} } };
}

beforeEach(() => {
  hasAccess.mockReset();
  open.mockReset();
  open.mockResolvedValue(null);
});

describe("addStickerBrowserControl", () => {
  it("adds the tool when access is granted", () => {
    hasAccess.mockReturnValue(true);
    const controls = emptyControls();

    addStickerBrowserControl(controls);

    expect(controls.tiles.tools["ddb-stickers"]).toBeDefined();
    expect(controls.tiles.tools["ddb-stickers"].title).toBe("DDB Sticker Browser");
  });

  it("omits the tool when access is denied", () => {
    hasAccess.mockReturnValue(false);
    const controls = emptyControls();

    addStickerBrowserControl(controls);

    expect(controls.tiles.tools["ddb-stickers"]).toBeUndefined();
  });

  it("does not let developer-mode bypass the access check", () => {
    // The hook used to render the tool for any tier whenever developer-mode was
    // on. hasAccess() is now the only gate, so dev mode must change nothing.
    setMockSettings({ "developer-mode": true, "custom-proxy": false, "patreon-tier": "COFFEE" });
    hasAccess.mockReturnValue(false);
    const controls = emptyControls();

    addStickerBrowserControl(controls);

    expect(controls.tiles.tools["ddb-stickers"]).toBeUndefined();
  });

  it("does not throw when the tiles control is absent", () => {
    hasAccess.mockReturnValue(true);
    const controls: Record<string, any> = { tokens: { tools: {} } };

    expect(() => addStickerBrowserControl(controls)).not.toThrow();
  });

  it("routes onChange through the gated open()", () => {
    hasAccess.mockReturnValue(true);
    const controls = emptyControls();
    addStickerBrowserControl(controls);

    controls.tiles.tools["ddb-stickers"].onChange(null, true);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("ignores onChange when the tool is being deactivated", () => {
    hasAccess.mockReturnValue(true);
    const controls = emptyControls();
    addStickerBrowserControl(controls);

    controls.tiles.tools["ddb-stickers"].onChange(null, false);
    expect(open).not.toHaveBeenCalled();
  });
});
