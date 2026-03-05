import DDBEnricherData from "../../data/DDBEnricherData";

export default class EmpoweredEvocation extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
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
