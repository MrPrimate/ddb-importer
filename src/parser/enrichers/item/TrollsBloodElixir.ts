import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Troll's Blood Elixir (World of Warcraft, every size): drinking heals a flat amount, and the same
 * amount again at the start of each of your turns for 1 minute while you have at least 1 Hit Point.
 * DDB's drink keeps its heal; the repeat is a free activity for each turn.
 */
export default class TrollsBloodElixir extends DDBEnricherData {

  // the sizes heal 2, 4, 6 and 8
  get amount(): string {
    const name = this.data.name;
    if (name.includes("(Supreme)")) return "8";
    if (name.includes("(Superior)")) return "6";
    if (name.includes("(Greater)")) return "4";
    return "2";
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // the "Troll's Blood Elixirs" catalog entry is not a potion
    if (this.data.name.endsWith("Elixirs")) return [];
    return [
      {
        init: { name: "Start of Turn", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: { type: "turnStart", value: 1, condition: "For 1 minute after drinking, while you have at least 1 Hit Point" },
          targetOverride: { override: true, affects: { type: "self" } },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: this.amount, types: ["healing"] }),
        },
      },
    ];
  }

}
