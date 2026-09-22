import { regionLabel, resolveRegionActivity } from "../../../src/effects/auras/regionBehaviorUtils";

describe("region activity resolution", () => {
  const variant = { id: "variant", name: "Aura Save (Strength DC)" };
  const exact = { id: "exact", name: "Aura Save" };
  const values = [variant, exact];
  const placing = { name: "Place Aura", item: { system: { activities: {
    get: (id: string) => values.find((activity) => activity.id === id),
    find: (predicate: (activity: typeof exact) => boolean) => values.find(predicate),
  } } } };

  it("uses the selected id, then exact names, then surviving family variants", () => {
    expect(resolveRegionActivity(placing, { activityId: "variant", activityName: "Aura Save" })).toBe(variant);
    expect(resolveRegionActivity(placing, { activityName: "Aura Save" })).toBe(exact);
    expect(resolveRegionActivity(placing, { activityName: "Aura Save (Strength" })).toBe(variant);
    expect(resolveRegionActivity(placing, {})).toBe(placing);
    expect(resolveRegionActivity(placing, { activityId: "deleted", activityName: "Aura Save" })).toBeNull();
  });
});

it("shows the region id only while same-named areas coexist in its scene", () => {
  const region = { id: "first", name: "Dust Vortex", parent: { regions: [] as unknown[] } };
  region.parent.regions.push(region);
  expect(regionLabel(region as unknown as RegionDocument)).toBe("Dust Vortex");
  region.parent.regions.push({ id: "second", name: "Dust Vortex" });
  expect(regionLabel(region as unknown as RegionDocument)).toBe("Dust Vortex (first)");
});
