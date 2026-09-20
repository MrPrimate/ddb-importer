import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import { hasItemSource, itemActivity } from "./_ItemActivities";
import { hasItemEffectChange } from "./_ItemPassive";

export default class FrostBrand extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return { retainActivityUseSpent: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if ((this.ddbParser as DDBItem).data.type !== "weapon") {
      return [];
    }
    return [
      itemActivity("Extinguish Flames", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationCondition:
          "When you draw the weapon; extinguish nonmagical flames within 30 feet manually. Reset this use after 1 hour.",
        addActivityConsume: true,
        rangeType: "ft",
        rangeValue: 30,
        overrideRange: true,
        data: { uses: { max: "1", spent: 0, recovery: [] } },
      }),
      itemActivity("Freezing Light", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationCondition:
          "While holding the weapon in freezing temperatures; remove the light effect when either condition ends",
        noeffect: false,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const parser = this.ddbParser as DDBItem;
    if (parser.data.type !== "weapon") {
      return [];
    }
    const effects: IDDBEffectHint[] = [
      {
        name: "Freezing Light",
        activityMatch: "Freezing Light",
        options: { transfer: false, durationSeconds: null },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "10"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
        ],
      },
    ];
    if (hasItemSource(this, 146) && !hasItemEffectChange(this, "system.traits.dr.value")) {
      effects.push({
        name: "Frost Brand Fire Resistance",
        options: {
          transfer: true,
          durationSeconds: null,
          description: "Fire resistance while holding the weapon; unequip when not held",
        },
        changes: [DDBEnricherData.ChangeHelper.addChange("fire", 20, "system.traits.dr.value")],
      });
    }
    return effects;
  }

}
