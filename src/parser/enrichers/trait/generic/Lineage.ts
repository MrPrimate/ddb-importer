import DDBEnricherData from "../../data/DDBEnricherData";

export default class Lineage extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  /**
   * Shortens an option's name ("Elven Lineage: Drow Lineage" to "Elven: Drow Lineage"). A trait kept
   * whole, because its options are only a spellcasting ability (Alfar's Elven Lineage), keeps its
   * name rather than becoming "Elven".
   */
  override get override(): IDDBOverrideData | null {
    if (this.data.name.startsWith("Gnomish ") || !this.data.name.includes(":")) return null;
    return {
      data: {
        name: `${this.data.name}`.replace(/ Lineage| Legacy$/i, ""),
      },
    };
  }

}
