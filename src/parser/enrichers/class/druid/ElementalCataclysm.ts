import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of Entropy: a Magic action and a spell slot burst elemental energy in a 10-foot-radius
 * sphere within 60 feet: a Dexterity save against your spell save DC for 1d6 per slot level (half on
 * a success), and Vulnerability to that type until the creature succeeds on a repeated save.
 */
export default class ElementalCataclysm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Elemental Cataclysm",
      activationType: "action",
      data: {
        range: { override: true, value: "60", units: "ft" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { type: "radius", size: "10", units: "ft", contiguous: false },
        },
        save: {
          ability: ["dex"],
          dc: { calculation: "spellcasting", formula: "" },
        },
        consumption: {
          targets: [
            { type: "spellSlots", value: "1", target: "1", scaling: { mode: "level", formula: "" } },
          ],
          scaling: { allowed: true, max: "8" },
          spellSlot: true,
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["acid", "cold", "fire", "lightning"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return ["acid", "cold", "fire", "lightning"].map((damageType) => ({
      name: `Elemental Cataclysm: ${damageType.charAt(0).toUpperCase()}${damageType.slice(1)} Vulnerability`,
      activityMatch: "Elemental Cataclysm",
      options: {
        durationSeconds: 60,
        description: "Repeat the Dexterity save at the end of each turn, ending the Vulnerability on a success.",
      },
      changes: [DDBEnricherData.ChangeHelper.damageVulnerabilityChange(damageType)],
    }));
  }

}
