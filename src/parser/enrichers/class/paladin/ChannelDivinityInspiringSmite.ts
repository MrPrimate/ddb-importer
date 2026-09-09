import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityInspiringSmite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Immediately after you cast Divine Smite",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, bonus: "@classes.paladin.levels", type: "temphp" }),
        range: {
          units: "ft",
          value: 30,
        },
      },
    };
  }

}
