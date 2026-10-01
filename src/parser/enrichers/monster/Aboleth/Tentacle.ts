import DDBEnricherData from "../../data/DDBEnricherData";

export default class Tentacle extends DDBEnricherData {
  override get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    if (!this.ddbEnricher.originalActivity) return null;
    // as a natural weapon the first part is the item's base damage, which the attack adds itself
    const parts = this.ddbEnricher.originalActivity.type === "save"
      || ("templateType" in this.ddbParser && this.ddbParser.templateType === "weapon")
      ? []
      : [this.ddbParser.actionData.damageParts[0].part];
    return {
      data: {
        damage: {
          parts,
        },
      },
    };
  }
}
