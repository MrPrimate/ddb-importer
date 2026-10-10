import { moveRiderDurationsToProfiles } from "../../../../src/parser/enrichers/effects/EffectExpiryHelpers";

/**
 * times-up disables an item's transfer effects once their counted duration passes, used or not, so
 * rider source effects carry no counted duration on Foundry 13: the enchantment profile does.
 */
describe("moveRiderDurationsToProfiles", () => {
  const document = (profileDuration: Record<string, unknown> = {}) => ({
    effects: [
      { _id: "profile", duration: profileDuration },
      { _id: "rider", duration: { seconds: 600, rounds: null, turns: null } },
      { _id: "otherRider", duration: { seconds: null, rounds: 10, turns: null } },
      { _id: "unrelated", duration: { seconds: 60, rounds: null, turns: null } },
    ],
    system: {
      activities: {
        enchant: { type: "enchant", effects: [{ _id: "profile", riders: { effect: ["rider", "otherRider"], activity: [] } }] },
        attack: { type: "attack", effects: [{ _id: "unrelated" }] },
      },
    },
  });
  const effect = (doc: any, id: string) => doc.effects.find((e: any) => e._id === id);

  it("gives a profile with no duration the longest rider duration and clears the riders", () => {
    const doc = document();
    moveRiderDurationsToProfiles(doc);
    expect(effect(doc, "profile").duration).toMatchObject({ seconds: 600 });
    expect(effect(doc, "rider").duration).toMatchObject({ seconds: null, rounds: null, turns: null });
    expect(effect(doc, "otherRider").duration).toMatchObject({ seconds: null, rounds: null, turns: null });
  });

  it("keeps a profile's own duration", () => {
    const doc = document({ seconds: 60 });
    moveRiderDurationsToProfiles(doc);
    expect(effect(doc, "profile").duration.seconds).toBe(60);
    expect(effect(doc, "rider").duration.seconds).toBeNull();
  });

  it("leaves effects that are not enchantment riders alone", () => {
    const doc = document();
    moveRiderDurationsToProfiles(doc);
    expect(effect(doc, "unrelated").duration.seconds).toBe(60);
  });
});
