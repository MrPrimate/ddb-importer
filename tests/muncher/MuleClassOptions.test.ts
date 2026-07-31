import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";

// _filterClassOptions only reads a few handler fields, so build a bare instance
// rather than running the constructor (which needs proxy/setting state).
function makeHandler({ include, sourceIds, allowHomebrew }: {
  include: boolean;
  sourceIds: number[];
  allowHomebrew?: boolean;
}): DDBMuleHandler {
  const handler = Object.create(DDBMuleHandler.prototype) as DDBMuleHandler;
  handler.includeOptionalClassFeatures = include;
  handler.optionSourceIds = sourceIds;
  handler.allowedHomebrew = allowHomebrew ?? false;
  return handler;
}

function option(name: string, sourceIds: number[], isHomebrew = false): IDDBClassFeatureDefinition {
  return {
    name,
    isHomebrew,
    sources: sourceIds.map((sourceId) => ({ sourceId, sourceType: 1, pageNumber: null })),
  } as unknown as IDDBClassFeatureDefinition;
}

describe("DDBMuleHandler._filterClassOptions", () => {
  // PHB (2), Tasha's (67), Northlands Worldbook (238)
  const options = [
    option("Fighting Style", [2]),
    option("Blade Mastery", [67]),
    option("Northlands Thing", [238]),
    option("Brewed Feature", [], true),
    option("Sourceless Feature", []),
  ];

  it("drops everything when optional class features are disabled", () => {
    const handler = makeHandler({ include: false, sourceIds: [2, 67, 238] });
    expect(handler._filterClassOptions(options)).toEqual([]);
  });

  it("keeps only options from the chosen sources", () => {
    const handler = makeHandler({ include: true, sourceIds: [2, 67] });
    expect(handler._filterClassOptions(options).map((o) => o.name))
      .toEqual(["Fighting Style", "Blade Mastery", "Sourceless Feature"]);
  });

  it("includes other sources when they are selected", () => {
    const handler = makeHandler({ include: true, sourceIds: [2, 67, 238] });
    expect(handler._filterClassOptions(options).map((o) => o.name)).toContain("Northlands Thing");
  });

  it("gates homebrew options on the homebrew toggle", () => {
    const noBrew = makeHandler({ include: true, sourceIds: [2] });
    expect(noBrew._filterClassOptions(options).map((o) => o.name)).not.toContain("Brewed Feature");

    const withBrew = makeHandler({ include: true, sourceIds: [2], allowHomebrew: true });
    expect(withBrew._filterClassOptions(options).map((o) => o.name)).toContain("Brewed Feature");
  });
});
