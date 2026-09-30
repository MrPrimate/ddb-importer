import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Wretched Bloodline: Bestow Curse cast for 3 Sorcery Points instead of a spell slot, without
 * Concentration and with a 60 foot range. FEATURE_SPELLS_IGNORE drops DDB's slot-less copy of the
 * spell; the always-prepared copy that spends a slot stays in the spellbook.
 */
export default class ShareTheBurden extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Bestow Curse",
      addSpellUuid: "Bestow Curse",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: 3,
      noSpellslot: true,
      data: {
        range: {
          override: true,
          units: "ft",
          value: "60",
        },
        spell: {
          spellbook: true,
          // cast activity properties are the ones the casting removes
          properties: ["concentration"],
        },
      },
    };
  }

}
