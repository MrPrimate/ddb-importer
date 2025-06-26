/* eslint-disable class-methods-use-this */
import { utils } from "../../../lib/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ElementalAdept extends DDBEnricherData {

  get override() {
    if (this.is2014) return null;

    const types = ["Acid", "Cold", "Fire", "Lightning", "Necrotic", "Poison", "Psychic", "Radiant", "Thunder"];

    const activeType = this.ddbParser?._chosen.find((a) =>
      types.includes(a.label),
    )?.label;

    const name = activeType
      ? `${this.ddbParser?.data?.name ?? ""} (${activeType})`
      : this.ddbParser?.data?.name;

    return {
      data: {
        name,
      },
    };
  }
}
