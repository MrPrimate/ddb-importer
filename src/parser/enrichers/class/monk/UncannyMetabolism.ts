import DDBEnricherData from "../../data/DDBEnricherData";

export default class UncannyMetabolism extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      itemConsumeValue: `-@scale.${this.classIdentifier("Monk")}.focus-points`,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `@scale.${this.classIdentifier("Monk")}.uncanny-metabolism.die + @classes.${this.classIdentifier("Monk")}.levels`,
          type: "healing",
        }),
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      retainChildUses: true,
    };
  }

}
