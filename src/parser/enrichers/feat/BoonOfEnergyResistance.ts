import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class BoonOfEnergyResistance extends DDBEnricherData {

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  get additionalActivities() {
    return [
      { action: { name: "Energy Redirection", type: "class" } },
    ];
  }

  get effects() {
    const activeType = this.ddbParser.isMuncher
      ? ""
      : (this.ddbParser._chosen?.find((a) =>
        utils.nameString(a.label).startsWith("Boon of Energy Resistance"),
      )?.label ?? "");

    const types = ["Acid", "Cold", "Fire", "Lightning", "Necrotic", "Poison", "Psychic", "Radiant", "Thunder"];
    const multiple = [];
    types.forEach((type) => {
      multiple.push({
        name: `Boon of Energy Resistance: ${type}`,
        options: {
          transfer: true,
          disabled: !activeType.includes(type),
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(type),
        ],
      });
    });

    return multiple;
  }

  get clearAutoEffects() {
    return true;
  }
}
