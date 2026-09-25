import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The 2014 spell brings a celestial, elemental or fiend of the patron's choosing. The dnd5e SRD
 * pack offers it as an open challenge-rating summon, so the player picks the creature from the
 * compendium browser when casting. The 2024 pack has no summon and is left alone.
 */
export default class PlanarAlly extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.SUMMON : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    return {
      name: "Summon",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      data: {
        summon: {
          mode: "cr",
          prompt: true,
        },
        profiles: [
          { name: "Planar Ally", count: "", cr: "30", types: ["celestial", "elemental", "fiend"] },
        ],
      },
    };
  }

}
