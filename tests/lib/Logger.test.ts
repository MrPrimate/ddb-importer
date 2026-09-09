/* eslint-disable no-console */
import logger, { setupLogger } from "../../src/lib/Logger";

beforeEach(() => {
  setupLogger();
  CONFIG.DDBI.CAPTURED_ERRORS = [];
  vi.spyOn(logger, "_showMessage").mockReturnValue(true);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

describe("error export", () => {
  it("preserves the message, type and stack in captured errors and recorded logs", () => {
    CONFIG.debug.ddbimporter.record = true;
    const error = new TypeError("Cannot read properties of undefined");
    logger.error("Unable to Generate Basic Feature: Test", error);

    const captured = JSON.parse(JSON.stringify(CONFIG.DDBI.CAPTURED_ERRORS));
    const recorded = JSON.parse(JSON.stringify(CONFIG.debug.ddbimporter.log));
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
