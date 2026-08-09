import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuidedPrecision extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bonus Damage",
      activationType: "special",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@abilities.int.mod",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

}
