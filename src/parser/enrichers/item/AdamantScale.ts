import DDBEnricherData from "../data/DDBEnricherData";
import SpellComponentItem from "./_SpellComponentItem";

/**
 * The Magus Class: consumed when casting Mage Armor. The target's Mage Armor base AC becomes
 * 15 + Dexterity modifier (an AC formula the system takes the highest of) and Critical Hits against
 * it become normal hits, for the spell's 8 hours.
 */
export default class AdamantScale extends SpellComponentItem {

  override get spellName(): string {
    return "Mage Armor";
  }

  override get componentActivity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      rangeType: "touch",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Adamant Scale",
        activityMatch: "Consume with Mage Armor",
        options: {
          transfer: false,
          durationSeconds: 28800,
          description: "Mage Armor's base AC is 15 + Dexterity modifier, and Critical Hits against this creature become normal hits.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.acFormulaAddChange("15 + @abilities.dex.mod"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.fail.critical.all"),
        ],
      },
    ];
  }

}
