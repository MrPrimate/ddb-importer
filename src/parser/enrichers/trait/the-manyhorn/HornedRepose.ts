import DDBEnricherData from "../../data/DDBEnricherData";

export default class HornedRepose extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get useDefaultAdditionalActivities() {
    return false;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Horned Repose (Str.)",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "An enemy within 5 ft misses you with a melee attack",
      data: {
        attack: {
          ability: "str",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        damage: {
          includeBase: false,
          parts: [
            DDBEnricherData.basicDamagePart({
              // finesse horns; +proficiency to damage from level 10
              customFormula: "1d6 + @mod + (@details.level >= 10 ? @prof : 0)",
              types: ["piercing"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Horned Repose (Dex.)",
          data: {
            attack: {
              ability: "dex",
            },
          },
        },
      },
    ];
  }

}
