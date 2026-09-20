import DDBEnricherData from "../data/DDBEnricherData";

export default class WarCaster extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Opportunity Spell",
      activationType: "reaction",
      targetType: "creature",
    };
  }

  // The concentration advantage comes from the DDB modifier ("made to maintain your concentration
  // on a spell when you take damage") through EffectGenerator's restriction table, so no
  // hand-rolled effect here: one would double the generated one.

  override get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
    };
  }

}
