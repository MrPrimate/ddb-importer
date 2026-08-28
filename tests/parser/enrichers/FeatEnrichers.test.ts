import Chef from "../../../src/parser/enrichers/feat/Chef";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

describe("Chef activity snippets", () => {
  it("points Eat Treat at the section that describes it", () => {
    const enricher = makeEnricherData(Chef);
    const activities = enricher.additionalActivities;

    // "Create Bolstering Treats" contains the DDB label, so it resolves on its own name;
    // "Eat Treat" has no textual relation to it and has to be told.
    expect(activities.map((a: any) => a.init.name)).toEqual(["Create Bolstering Treats", "Eat Treat"]);
    expect(activities[0].overrides).toBeUndefined();
    expect(activities[1].overrides?.useActivitySnippet).toEqual({ section: "Bolstering Treats" });
  });
});
