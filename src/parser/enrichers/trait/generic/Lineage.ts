import DDBEnricherData from "../../data/DDBEnricherData";

export default class Lineage extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get override(): IDDBOverrideData {
    if (this.data.name.startsWith("Gnomish ")) return null;
    return {
      data: {
        name: `${this.data.name}`.replace(/ Lineage| Legacy$/i, ""),
      },
    };
  }

}
