import DDBEnricherData from "../data/DDBEnricherData";

/** The three AU Staff of Skulls variants share one enricher and branch on the item name. */
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
            options: { expiry: "targetEnd", description: "Disadvantage on the triggering attack roll." },
            ac5eChanges: [
              DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
            ],
            midiChanges: [
              DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
            ],
          },
        ];
      case "pulverizing":
        return [
          {
            name: "Pulverized",
            activityMatch: "Pulverize",
            statuses: ["Prone"],
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
