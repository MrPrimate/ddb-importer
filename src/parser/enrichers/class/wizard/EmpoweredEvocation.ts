import DDBEnricherData from "../../data/DDBEnricherData";

export default class EmpoweredEvocation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "creature",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "@abilities.int.mod",
          types: DDBEnricherData.allDamageTypes(),
        }),
      ],
    };
  }

}
