import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuidedPrecision extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
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
