import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Airbag Shield (OTFY): casts Airbag on yourself once per dawn. DDB attaches no item spell, so the
 * cast activity is added here; spending a level 1+ spell slot to restore the use is done by hand.
 */
export default class AirbagShield extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Airbag",
      addSpellUuid: "Airbag",
      noSpellslot: true,
      activationType: "reaction",
      activationCondition: "You take Bludgeoning, Piercing, or Slashing damage",
      targetType: "self",
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [{ period: "dawn", type: "recoverAll" }],
      },
    };
  }

}
