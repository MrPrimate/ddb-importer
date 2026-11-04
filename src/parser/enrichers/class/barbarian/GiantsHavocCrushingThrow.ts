import DDBEnricherData from "../../data/DDBEnricherData";

export default class GiantsHavocCrushingThrow extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Damage",
      targetType: "creature",
      activationType: "special",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: `@scale.${this.classIdentifier("Barbarian")}.rage-damage`,
          types: DDBEnricherData.allDamageTypes(),
        }),
      ],
    };
  }

}
