import DDBEnricherData from "../../data/DDBEnricherData";
import Lineage from "../generic/Lineage";

type TTrollLineage = "Amani Troll" | "Darkspear Troll" | "Zandalari Troll";

const LINEAGES: TTrollLineage[] = ["Amani Troll", "Darkspear Troll", "Zandalari Troll"];

/**
 * Troll Lineage (World of Warcraft). Amani Troll regains an expended Hit Point Die whenever it spends
 * Heroic Inspiration, and Zandalari Troll gains Heroic Inspiration at the end of a turn in which it
 * rolled a 1 on a D20 Test; each gets a reminder activity (the Amani one restores the die). The
 * Darkspear Troll's Dash through difficult terrain is passive.
 */
export default class TrollLineage extends Lineage {

  get lineages(): TTrollLineage[] {
    const names = [
      ...(this.ddbParser._chosen ?? []).map((choice) => choice.label),
      this.data.name,
    ].map((name) => (name ?? "").trim());
    const chosen = LINEAGES.filter((lineage) => names.some((name) => name === lineage || name.endsWith(`: ${lineage}`)));
    return chosen.length > 0 ? chosen : LINEAGES;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if (this.lineages.includes("Amani Troll")) {
      activities.push({
        init: { name: "Regain Hit Point Die", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: true,
          activationOverride: { type: "special", value: 1, condition: "Whenever you spend Heroic Inspiration" },
          consumptionOverride: {
            spellSlot: false,
            scaling: { allowed: false, max: "" },
            targets: [{ type: "hitDice", target: "smallest", value: "-1", scaling: { mode: "", formula: "" } }],
          },
        },
      });
    }
    if (this.lineages.includes("Zandalari Troll")) {
      activities.push({
        init: { name: "Gain Heroic Inspiration", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "At the end of a turn in which you rolled a 1 on the d20 for a D20 Test" },
        },
      });
    }
    return activities;
  }

}
