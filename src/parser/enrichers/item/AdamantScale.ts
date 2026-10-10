import DDBEnricherData from "../data/DDBEnricherData";
import SpellComponentItem from "./_SpellComponentItem";

/**
 * The Magus Class: consumed when casting Mage Armor. The target's Mage Armor base AC becomes
 * 15 + Dexterity modifier and Critical Hits against it become normal hits, for the spell's 8 hours.
 * dnd5e 5.x has a single custom AC formula rather than a list of candidates it takes the highest
 * of, so the formula keeps worn armor when that is better (armor ends Mage Armor).
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
          DDBEnricherData.ChangeHelper.overrideChange("custom", 20, "system.attributes.ac.calc"),
          DDBEnricherData.ChangeHelper.overrideChange(
            "max(15 + @abilities.dex.mod, @attributes.ac.armor + @attributes.ac.dex)",
            20,
            "system.attributes.ac.formula",
          ),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.fail.critical.all"),
        ],
      },
    ];
  }

}
