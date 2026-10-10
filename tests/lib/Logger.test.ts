/* eslint-disable no-console */
import logger, { ddbDebug, setupLogger } from "../../src/lib/Logger";

beforeEach(() => {
  setupLogger();
  CONFIG.DDBI.CAPTURED_ERRORS = [];
  vi.spyOn(logger, "_showMessage").mockReturnValue(true);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

describe("error export", () => {
  it("preserves the message, type and stack in captured errors and recorded logs", () => {
    ddbDebug().record = true;
    const error = new TypeError("Cannot read properties of undefined");
    logger.error("Unable to Generate Basic Feature: Test", error);

    const captured = JSON.parse(JSON.stringify(CONFIG.DDBI.CAPTURED_ERRORS));
    const recorded = JSON.parse(JSON.stringify(ddbDebug().log));
    const expected = { name: "TypeError", message: error.message, stack: error.stack };
    expect(captured[0].payload).toEqual([expected]);
    expect(recorded[0].data[1]).toEqual(expected);
    // Console diagnostics retain the actual Error for interactive inspection.
    expect(console.error).toHaveBeenCalledWith(captured[0].msg, error);
  });

  it("keeps a directly logged Error in the payload", () => {
    const error = new Error("Import failed");
    logger.error(error);
    const [captured] = JSON.parse(JSON.stringify(CONFIG.DDBI.CAPTURED_ERRORS));
    expect(captured.payload).toEqual([{ name: "Error", message: error.message, stack: error.stack }]);
  });

  it("preserves ordinary context payloads and message-only logs", () => {
    const context = { name: "Test", count: 2 };
    logger.error("Context", context);
    logger.error("Message only");
    expect(CONFIG.DDBI.CAPTURED_ERRORS[0].payload).toEqual([context]);
    expect(CONFIG.DDBI.CAPTURED_ERRORS[1].payload).toBeNull();
  });
});

describe("timers", () => {
  it("starts a console timer on time and ends the same label on timeEnd", () => {
    const time = vi.spyOn(console, "time").mockImplementation(() => undefined);
    const timeEnd = vi.spyOn(console, "timeEnd").mockImplementation(() => undefined);
    logger.time("Monster Parsing");
    expect(time).toHaveBeenCalledTimes(1);
    expect(timeEnd).not.toHaveBeenCalled();
    logger.timeEnd("Monster Parsing");
    expect(timeEnd).toHaveBeenCalledWith(time.mock.calls[0][0]);
  });
});

describe("level override", () => {
  afterEach(() => {
    logger.setLevelOverride(null);
  });

  it("takes precedence over the world setting while set and returns the previous override", () => {
    vi.mocked(logger._showMessage).mockRestore();
    const get = vi.spyOn(game.settings, "get").mockReturnValue("DEBUG" as never);
    expect(logger._showMessage("DEBUG", ["msg"])).toBe(true);

    expect(logger.setLevelOverride("warn")).toBeNull();
    expect(logger._showMessage("DEBUG", ["msg"])).toBe(false);
    expect(logger._showMessage("INFO", ["msg"])).toBe(false);
    expect(logger._showMessage("WARN", ["msg"])).toBe(true);
    expect(logger._showMessage("ERR", ["msg"])).toBe(true);

    expect(logger.setLevelOverride(null)).toBe("WARN");
    expect(logger._showMessage("DEBUG", ["msg"])).toBe(true);
    get.mockRestore();
  });

  it("rejects an unknown level and keeps the current override", () => {
    logger.setLevelOverride("ERR");
    expect(() => logger.setLevelOverride("LOUD")).toThrow(/Unknown log level/);
    expect(logger.levelOverride).toBe("ERR");
  });
});
