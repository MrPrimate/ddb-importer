import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";

// _cacheLabel only reads the type, class id, filter ids and the buffered source, so build a bare
// instance rather than running the constructor (which needs proxy/setting state)
function makeHandler({ type, classId = null, filterIds = [], source = {} }: {
  type: string;
  classId?: number | null;
  filterIds?: number[];
  source?: Record<string, unknown>;
}): DDBMuleHandler {
  const handler = Object.create(DDBMuleHandler.prototype) as DDBMuleHandler;
  handler.type = type;
  handler.classId = classId;
  handler.filterIds = filterIds;
  handler.source = source as never;
  return handler;
}

describe("DDBMuleHandler._cacheLabel", () => {
  it("names the class and its subclasses from the streamed source", () => {
    const handler = makeHandler({
      type: "class",
      classId: 12,
      source: {
        class: { name: "Fighter" },
        subClasses: { 12: [{ name: "Champion" }, { name: "Battle Master" }, { name: "" }] },
      },
    });
    expect(handler._cacheLabel()).toBe("Fighter: Battle Master, Champion");
  });

  it("caps a long subclass list", () => {
    const handler = makeHandler({
      type: "class",
      classId: 12,
      source: { class: { name: "Wizard" }, subClasses: { 12: "ABCDEFGH".split("").map((name) => ({ name })) } },
    });
    expect(handler._cacheLabel()).toBe("Wizard: A, B, C, D, E, F and 2 more");
  });

  it("falls back to the class id when the stream never named the class", () => {
    expect(makeHandler({ type: "class", classId: 12 })._cacheLabel()).toBe("class 12");
  });

  it("describes feat, background and species runs by their selection", () => {
    expect(makeHandler({ type: "feat", filterIds: [1, 2, 3] })._cacheLabel()).toBe("Feats: 3 selected");
    expect(makeHandler({ type: "background" })._cacheLabel()).toBe("Backgrounds: all");
    expect(makeHandler({ type: "species", filterIds: [9] })._cacheLabel()).toBe("Species: 1 selected");
  });
});
