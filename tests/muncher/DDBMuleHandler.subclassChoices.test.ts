// Adapted from main: this branch has no local proxy cache, so the stream is the only source.
import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";
import DDBMuleSocket from "../../src/lib/streaming/DDBMuleSocket";
import { resetMockSettings, setMockSettings } from "../_setup/foundryMocks";

/**
 * A subclass choice pass can reach processing before the subClassData it is merged over. It
 * must wait for that data rather than being dropped, and a pass whose data never arrives must be
 * reported as a failed import.
 */

const SUBCLASS_ID = 10;
const subClassData = { debug: { subClassId: SUBCLASS_ID, subclassName: "Path of Testing" }, data: {} };
const choicePass = (pass: number) => ({ debug: { subClassId: SUBCLASS_ID, subclassName: "Path of Testing" }, data: { pass } });

type TStep = { kind: string; payload: any } | "tick";

const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

function handler() {
  return new DDBMuleHandler({ characterId: "123", type: "class", classId: 7, sources: [1] });
}

/** Streams the steps in order; "tick" lets queued processing run between two events. */
function socketWith(steps: TStep[], cached: Record<string, unknown> | null = null) {
  vi.spyOn(DDBMuleSocket.prototype, "connect").mockImplementation(function (this: DDBMuleSocket, handlers) {
    this.handlers = handlers;
  });
  vi.spyOn(DDBMuleSocket.prototype, "auth").mockResolvedValue({ ok: true });
  return vi.spyOn(DDBMuleSocket.prototype, "start").mockImplementation(async function (this: DDBMuleSocket) {
    if (cached) {
      this.handlers?.onEvent({ kind: "cacheHit", payload: { data: cached } });
    } else {
      for (const step of steps) {
        if (step === "tick") await tick();
        else this.handlers?.onEvent({ kind: step.kind, payload: step.payload, pass: step.payload?.data?.pass });
      }
    }
    this.handlers?.onDone?.({});
    return { ok: true };
  });
}

describe("mule subclass choice passes that arrive before their subclass data", () => {
  let processed: any[];

  beforeEach(async () => {
    resetMockSettings();
    setMockSettings({
      "proxy-cache-enabled": false, "proxy-cache-ttl-hours": 168,
      "custom-proxy": false, "cobalt-cookie-local": false, "cobalt-cookie": "test-cobalt", "campaign-id": "",
      "munching-policy-character-class-rules-version": "2014", "dnd5e.rulesVersion": "modern",
      "munching-policy-character-optional-class-features": false,
      "munching-policy-use-source-filter": false, "munching-policy-muncher-included-source-categories": [],
      "munching-policy-muncher-sources": [],
    });
    processed = [];
    vi.spyOn(DDBMuleHandler.prototype, "_getStreamMockActor").mockReturnValue({} as TImporterActor);
    vi.spyOn(DDBMuleHandler.prototype, "_buildDDBStub").mockResolvedValue({ character: {} } as IDDBData);
    vi.spyOn(DDBMuleHandler.prototype, "_subclassChoiceProcess").mockImplementation(async ({ subClassChoiceData }) => {
      processed.push(subClassChoiceData);
    });
    vi.spyOn(DDBMuleHandler.prototype, "notifier").mockImplementation(() => undefined);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    resetMockSettings();
  });

  it("parses a pass that arrived first once its subclass data arrives", async () => {
    socketWith([
      { kind: "subClassChoices", payload: choicePass(1) },
      "tick",
      { kind: "subClassData", payload: subClassData },
      "tick",
    ]);
    const muleHandler = handler();
    await muleHandler._fetchMuleData();
    expect(processed.map((choice) => choice.data.pass)).toEqual([1]);
    expect(muleHandler._streamProcessingErrors).toBe(0);
    expect(muleHandler._deferredSubClassChoices.size).toBe(0);
  });

  it("parses passes that arrive after their subclass data straight away", async () => {
    socketWith([
      { kind: "subClassData", payload: subClassData },
      { kind: "subClassChoices", payload: choicePass(1) },
      "tick",
      { kind: "subClassChoices", payload: choicePass(2) },
    ]);
    const muleHandler = handler();
    await muleHandler._fetchMuleData();
    expect(processed.map((choice) => choice.data.pass)).toEqual([1, 2]);
    expect(muleHandler._streamProcessingErrors).toBe(0);
  });

  it("parses each early pass once when the subclass data is replayed", async () => {
    socketWith([
      { kind: "subClassChoices", payload: choicePass(1) },
      { kind: "subClassChoices", payload: choicePass(2) },
      "tick",
      { kind: "subClassData", payload: subClassData },
      "tick",
      { kind: "subClassData", payload: subClassData },
    ]);
    const muleHandler = handler();
    await muleHandler._fetchMuleData();
    expect(processed.map((choice) => choice.data.pass)).toEqual([1, 2]);
    expect(muleHandler._streamProcessingErrors).toBe(0);
  });

  it("reports passes whose subclass data never arrives", async () => {
    socketWith([
      { kind: "subClassChoices", payload: choicePass(1) },
      "tick",
    ]);
    const muleHandler = handler();
    await muleHandler._fetchMuleData();
    expect(processed).toEqual([]);
    expect(muleHandler._streamProcessingErrors).toBe(1);
    expect(muleHandler._deferredSubClassChoices.size).toBe(0);
  });

  it("replays a cached stream, reporting only the passes with no subclass data", async () => {
    socketWith([], {
      subClasses: {}, subClassData: { [SUBCLASS_ID]: subClassData },
      subClassChoicesData: [choicePass(1), { debug: { subClassId: 99, subclassName: "Missing" }, data: { pass: 2 } }],
    });
    const muleHandler = handler();
    await muleHandler._fetchMuleData();
    expect(processed.map((choice) => choice.data.pass)).toEqual([1]);
    expect(muleHandler._streamProcessingErrors).toBe(1);
  });
});
