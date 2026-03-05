import DDBEnricherData from "../../data/DDBEnricherData";

export default class UncannyMetabolism extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      itemConsumeValue: "-@scale.monk.focus-points",
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
          customFormula: "@scale.monk.uncanny-metabolism.die + @classes.monk.levels",
          type: "healing",
        }),
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      retainChildUses: true,
    };
  }

}
