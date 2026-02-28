import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityInspiringSmite extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activities() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Immediately after you cast Divine Smite",
      addItemUse: true,
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
