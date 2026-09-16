import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import utils from "../../../lib/Utils";
import { hasItemSource, itemActivity } from "./_ItemActivities";

export default class WaveSweptWeapon extends DDBEnricherData {

  /** Only concrete tiers have selected powers; the family root is an unselected catalogue entry. */
  get tier(): number {
    if (!hasItemSource(this, 301)) {
      return 0;
    }
    const name = (this.ddbParser as DDBItem).ddbDefinition.name;
    return ({ Barnacled: 1, Aquatic: 2, Ascendant: 3 } as Record<string, number>)[name.split(" ")[0]] ?? 0;
  }

  override get override(): IDDBOverrideData | null {
    return this.tier ? { data: { "system.magicalBonus": this.tier } } : null;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return this.tier === 0;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.tier) {
      return [];
    }
    const activities = [
      itemActivity("Infuse Brine", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        activationCondition: "While holding the weapon, touch up to one gallon of liquid; resolve the change manually",
        rangeType: "touch",
        overrideRange: true,
        targetType: "object",
        targetCount: "1",
      }),
    ];
    if (this.tier >= 2) {
      activities.push(
        itemActivity("Hold Wave-Swept Weapon", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
          activationType: "none",
          noeffect: false,
          activationCondition: "While holding the weapon; remove the holding effect when you put it away or release it",
        }),
      );
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.tier) {
      return [];
    }
    const effects: IDDBEffectHint[] = [
      {
        noCreate: true,
        func: ({ effect }) => {
          // The speeds only apply while holding the weapon (the holding effect below), and the weapon
          // bonus must not affect unrelated attacks.
          const replaced = [
            "system.rolls.attack.mwak.bonus",
            "system.attributes.movement.speeds.swim",
            "system.attributes.movement.speeds.fly",
          ];
          if (effect.system?.changes) {
            effect.system.changes = effect.system.changes.filter(
              (change: IActiveEffectChangeData) => !replaced.includes(change.key),
            );
          }
        },
      },
    ];
    if (this.tier >= 2) {
      effects.push({
        name: "Wave-Swept Holding Traits",
        activityMatch: "Hold Wave-Swept Weapon",
        data: { _id: utils.namedIDStub("Wave-Swept Holding", { prefix: "ddb" }) },
        options: {
          transfer: false,
          durationSeconds: null,
          description: "While holding the attuned weapon, you can breathe underwater. Remove when no longer held.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange(30, 20, "system.attributes.movement.speeds.swim"),
          ...(this.tier === 3
            ? [DDBEnricherData.ChangeHelper.upgradeChange(30, 20, "system.attributes.movement.speeds.fly")]
            : []),
          DDBEnricherData.ChangeHelper.upgradeChange(5, 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange(10, 20, "token.light.dim"),
        ],
      });
    }
    return effects;
  }

}
