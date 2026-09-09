import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverFeralFighting extends DDBEnricherData {

  override get builtFeaturesFromActionFilters(): string[] {
    return ["Feral Fighting: Unarmed Strike"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Unarmed Strike",
      activationType: "bonus",
      targetType: "creature",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 8,
          bonus: "@abilities.str.mod",
          type: "bludgeoning",
        }),
      ],
      data: {
        attack: {
          ability: "str",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        range: {
          units: "ft",
          value: "5",
        },
      },
    };
  }

}
