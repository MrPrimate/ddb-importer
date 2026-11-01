import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Airbag Shield (OTFY): casts Airbag on yourself once per dawn, as a reaction. The cast is built here
 * so it can target only you. Once ddb-proxy has learnt Airbag as the shield's item spell (it records
 * item spells from character imports and injects them into item munches), the item-spell path sees
 * this cast and adds none. Spending a level 1+ spell slot to restore the use is done by hand.
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
      // dnd5e's Cast activity keeps the spell's own targeting unless told to override it
      overrideTarget: true,
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
