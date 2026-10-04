import DDBEnricherData from "../../data/DDBEnricherData";

/** Aura of Fraternity: you and allies in your Aura of Protection deal an extra 1d4 with melee weapons and Unarmed Strikes. */
export default class AuraOfFraternity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Fraternal Strike",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You or an ally in your Aura of Protection hits with a melee weapon or Unarmed Strike",
      noTemplate: true,
      data: {
        damage: { parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["bludgeoning", "piercing", "slashing"] })] },
      },
    };
  }

}
