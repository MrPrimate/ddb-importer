import DDBEnricherData from "../data/DDBEnricherData";
import { shippedItemSpellNames } from "./_ItemActivities";

/**
 * The three AU Staff of Skulls variants share one enricher and branch on the item name. The
 * Ominous staff casts Chill Touch with the wielder's own spell attack bonus, grants advantage on
 * Intimidation and sheds dim light while held.
 */
export default class StaffOfSkulls extends DDBEnricherData {

  get variant(): "chattering" | "ominous" | "pulverizing" | "base" {
    const name = this.name.toLowerCase();
    if (name.startsWith("chattering")) return "chattering";
    if (name.startsWith("ominous")) return "ominous";
    if (name.startsWith("pulverizing")) return "pulverizing";
    return "base";
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    switch (this.variant) {
      case "chattering":
        return [
          {
            init: { name: "Chatter (Impose Disadvantage)", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
            build: { generateActivation: true, generateConsumption: false, generateRange: true, generateTarget: true, rangeOverride: { value: "30", units: "ft", special: "" } },
            overrides: { targetType: "creature", activationType: "reaction", activationCondition: "A creature you can see within 30 feet makes an attack roll", noTemplate: true },
          },
        ];
      case "pulverizing":
        return [
          {
            init: { name: "Pulverize", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
            build: {
              generateSave: true,
              generateDamage: true,
              generateActivation: true,
              generateConsumption: true,
              generateRange: true,
              saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
              onSave: "half",
              damageParts: [DDBEnricherData.basicDamagePart({ number: 10, denomination: 8, type: "necrotic", scalingMode: "none" })],
              rangeOverride: { value: "60", units: "ft", special: "" },
            },
            overrides: { targetType: "creature", activationType: "action", addItemConsume: true, noTemplate: true },
          },
        ];
      case "ominous":
        // a character import that already carries Chill Touch as an item spell has its cast
        if (shippedItemSpellNames(this).includes("Chill Touch")) return [];
        return [
          {
            init: { name: "Cast Chill Touch", type: DDBEnricherData.ACTIVITY_TYPES.CAST },
            build: { generateSpell: true, generateConsumption: false },
            // the staff's own spell attack is not fixed, so the caster's is used
            overrides: { addSpellUuid: "Chill Touch", noSpellslot: true },
          },
        ];
      default:
        return [];
    }
  }

  override get effects(): IDDBEffectHint[] {
    switch (this.variant) {
      case "chattering":
        return [
          {
            name: "Chattering Skulls",
            activityMatch: "Chatter (Impose Disadvantage)",
            options: {
              transfer: false,
              expiry: "targetEnd",
              description: "Disadvantage on the triggering attack roll. Without AC5e the effect lasts for every attack until the end of the target's next turn.",
            },
            // AC5e's once ends the effect after the one attack; the expiry is the ceiling
            ac5eChanges: [
              DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
            ],
            midiChanges: [
              DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
            ],
          },
        ];
      case "ominous":
        return [
          {
            name: "Ominous Staff of Skulls",
            options: {
              transfer: true,
              description: "Advantage on Charisma (Intimidation) checks and Dim Light in a 5-foot radius while you hold the staff.",
            },
            changes: [
              DDBEnricherData.ChangeHelper.advantageSkillChange("itm"),
            ],
            tokenChanges: [
              DDBEnricherData.ChangeHelper.upgradeChange(5, 20, "token.light.dim"),
            ],
          },
        ];
      case "pulverizing":
        return [
          {
            name: "Pulverized",
            activityMatch: "Pulverize",
            statuses: ["Prone"],
            options: {
              transfer: false,
            },
          },
        ];
      default:
        return [];
    }
  }

  override get override(): IDDBOverrideData {
    if (this.variant !== "pulverizing") return {};
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [{ period: "dawn", type: "recoverAll" }],
      },
    };
  }

}
