import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Misfortune Bringer rogue level 13: a Magic action spending 3 Jinx Points to cast Bestow Curse.
 * DDB's slot-less Bestow Curse spell copy is dropped by FEATURE_SPELLS_IGNORE; the cast activity
 * links the compendium spell instead.
 */
export default class CurseCaster extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Bestow Curse",
      activationType: "action",
      addSpellUuid: "Bestow Curse",
      noSpellslot: true,
      addItemConsume: true,
      itemConsumeTargetName: "Jinx Points",
      itemConsumeValue: "3",
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
