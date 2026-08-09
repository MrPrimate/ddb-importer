import DDBEnricherData from "../../data/DDBEnricherData";

export default class Haste extends DDBEnricherData {
  override get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    return {
      activationType: "action",
    };
  }
}
