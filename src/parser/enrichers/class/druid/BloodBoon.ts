import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodBoon extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature you can see within 60 feet is reduced to 0 hit points",
      addItemConsume: true,
      data: {
        range: {
          units: "ft",
          value: "60",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.druid.levels",
          types: ["temphp"],
        }),
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<p><i>When you use this feature, remember to also regain 1 spent Hit Die.</i></p>`,
    };
  }

}
