import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class BoonOfEnergyResistance extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      // DDB files the boon's reaction under the feat actions, not the class ones
      { action: { name: "Energy Redirection", type: "feat" } },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const activeType = this.ddbParser.isMuncher
      ? ""
      : (this.ddbParser._chosen?.find((a) =>
        utils.nameString(a.label).startsWith("Boon of Energy Resistance"),
      )?.label ?? "");

    const types = ["Acid", "Cold", "Fire", "Lightning", "Necrotic", "Poison", "Psychic", "Radiant", "Thunder"];
    const multiple: IDDBEffectHint[] = [];
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

  override get clearAutoEffects(): boolean {
    return true;
  }
}
