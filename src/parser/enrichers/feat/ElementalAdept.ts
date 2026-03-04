import DDBEnricherData from "../data/DDBEnricherData";

export default class ElementalAdept extends DDBEnricherData {

  get override(): IDDBOverrideData {
    if (this.is2014) return null;

    const types = [
      "Acid",
      "Cold",
      "Fire",
      "Lightning",
      "Thunder",
    ];

    const activeType = this.ddbParser._chosen?.find((a) =>
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
