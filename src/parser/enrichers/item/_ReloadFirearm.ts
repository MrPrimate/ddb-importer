import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import { hasItemSource, itemActivity, itemText, itemUses } from "./_ItemActivities";

/** Magazine counts belong only to the firearm definitions with the Reload property. */
export default abstract class _ReloadFirearm extends DDBEnricherData {

  abstract capacity: number;

  get supported(): boolean {
    return (
      hasItemSource(this, 3, 146) &&
      (/reload/i).test(itemText(this)) &&
      ((this.ddbParser as DDBItem).ddbDefinition.properties ?? []).some((p) => p.name === "Reload")
    );
  }

  override get activity(): IDDBActivityData | null {
    return this.supported ? { addItemConsume: true } : null;
  }

  override get override(): IDDBOverrideData | null {
    return this.supported ? itemUses(this, String(this.capacity)) : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.supported) {
      return [];
    }
    const result = [
      itemActivity("Reload (Action)", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        addItemConsume: true,
        itemConsumeValue: "-@item.uses.spent",
      }),
      itemActivity("Reload (Bonus Action)", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        addItemConsume: true,
        itemConsumeValue: "-@item.uses.spent",
      }),
    ];
    const source = (this.ddbParser as DDBItem).ddbDefinition;
    if (source.properties?.some((p) => p.name === "Burst Fire") && source.damage) {
      result.push(
        itemActivity("Burst Fire", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
          activationType: "action",
          addItemConsume: true,
          itemConsumeValue: "10",
          noTemplate: false,
          activationCondition: "Expend 10 bullets; deduct inventory ammunition manually for this area attack",
          rangeType: "ft",
          rangeValue: source.range,
          overrideRange: true,
          overrideTarget: true,
          data: {
            save: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
            damage: {
              includeBase: false,
              onSave: "none",
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: source.damage.diceCount,
                  denomination: source.damage.diceValue,
                  type: (source.damageType ?? "Piercing").toLowerCase(),
                }),
              ],
            },
            target: { affects: { type: "creature", count: "" }, template: { type: "cube", size: "10", units: "ft" } },
          },
        }),
      );
    }
    return result;
  }

}
