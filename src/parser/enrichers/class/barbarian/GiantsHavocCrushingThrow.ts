import DDBEnricherData from "../../data/DDBEnricherData";

export default class GiantsHavocCrushingThrow extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Damage",
      targetType: "creature",
      activationType: "special",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "@scale.barbarian.rage-damage",
          types: DDBEnricherData.allDamageTypes(),
        }),
      ],
    };
  }

}
