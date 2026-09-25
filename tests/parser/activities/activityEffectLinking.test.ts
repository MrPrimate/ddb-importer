// CharacterFeatureFactory must load first, it initialises the activity/feature class chain.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBActivityFactoryMixin from "../../../src/parser/activities/mixins/DDBActivityFactoryMixin";

function link({ activities, effects }: { activities: Record<string, any>; effects: any[] }) {
  const parser = Object.create(DDBActivityFactoryMixin.prototype);
  Object.assign(parser, {
    name: "Test Feature",
    data: { system: { activities }, effects, flags: {} },
  });
  parser._activityEffectLinking();
  return parser.data;
}

function effect(_id: string, { activityMatch, transfer = false }: { activityMatch?: string; transfer?: boolean } = {}) {
  return {
    _id,
    name: _id,
    transfer,
    flags: { ddbimporter: activityMatch ? { activityMatch } : {} },
  };
}

const ids = (activity: any) => activity.effects.map((e: any) => e._id);

describe("DDBActivityFactoryMixin._activityEffectLinking with two enchant activities", () => {
  it("keeps each activity's named profiles apart and rolls up the riders", () => {
    const profile = (_id: string, activityMatch: string, activityRiders: string[] = []) => ({
      ...effect(_id, { activityMatch }),
      type: "enchantment",
      flags: { ddbimporter: { activityMatch, activityRiders } },
    });
    const data = link({
      activities: {
        self: { name: "Alter", type: "enchant", enchant: { self: true }, effects: [] },
        strike: { name: "Grown Weapon", type: "enchant", effects: [] },
      },
      effects: [
        profile("optionProfileOne", "Alter"),
        profile("optionProfileTwo", "Alter", ["strike"]),
        profile("strikeEnchantmnt", "Grown Weapon"),
      ],
    });

    expect(ids(data.system.activities.self)).toEqual(["optionProfileOne", "optionProfileTwo"]);
    expect(ids(data.system.activities.strike)).toEqual(["strikeEnchantmnt"]);
    expect(data.system.activities.self.effects[1].riders.activity).toEqual(["strike"]);
    expect(data.flags.dnd5e.riders.activity).toEqual(["strike"]);
  });
});

