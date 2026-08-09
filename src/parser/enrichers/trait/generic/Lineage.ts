import DDBEnricherData from "../../data/DDBEnricherData";

export default class Lineage extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get override(): IDDBOverrideData | null {
    if (this.data.name.startsWith("Gnomish ")) return null;
    return {
      data: {
        name: `${this.data.name}`.replace(/ Lineage| Legacy$/i, ""),
      },
    };
  }

}
