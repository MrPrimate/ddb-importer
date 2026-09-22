import DDBEnricherData from "../../data/DDBEnricherData";
import { areaPlacer, areaTrigger } from "../../data/AreaBuilders";

const PUNISH = "Punish the Wicked";

/**
 * DDB ships no action or uses, so the feature imported with nothing usable. Activating it is a
 * Bonus Action, once a Long Rest or for a level 5 slot, and grants Fire immunity for the 10
 * minutes. Punish the Wicked answers a hostile creature ending its turn within the paladin's
 * reach, which Relentless Judgment extends by 10 feet, so the aura is a 15-foot emanation; a
 * reach weapon widens it by hand. The Opportunity Attack arm uses the same save by hand.
 */
export default class FireAndBrimstone extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate",
      activationType: "bonus",
      targetType: "self",
      addItemConsume: true,
      data: {
        duration: { override: true, value: "10", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      areaPlacer("Place Aura", {
        template: { type: "radius", size: "15" },
        affects: "enemy",
        activationType: "special",
        activationCondition: "While Fire and Brimstone is active; your reach, 15 feet without a reach weapon",
      }),
      areaTrigger(PUNISH, {
        affects: "enemy",
        condition: "A hostile creature ends its turn within your reach, or you hit a creature with an Opportunity Attack",
        save: { ability: ["cha"], calculation: "spellcasting" },
      }),
      {
        init: { name: "Spend Spell Slot to Restore Use", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: { type: "none", value: null, condition: "" },
          consumptionOverride: {
            targets: [
              { type: "itemUses", target: "", value: "-1", scaling: { mode: "", formula: "" } },
              { type: "spellSlots", value: "1", target: "5", scaling: { mode: "", formula: "" } },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fire and Brimstone",
        activityMatch: "Activate",
        changes: [DDBEnricherData.ChangeHelper.damageImmunityChange("fire")],
        options: { transfer: false, durationSeconds: 600, description: "Immunity to Fire damage; reach increased by 10 feet, and melee attacks ignore Half and Three-Quarters Cover." },
      },
      {
        name: "Punished",
        activityMatch: PUNISH,
        statuses: ["Prone"],
        changes: [DDBEnricherData.ChangeHelper.customChange("*0", 90, "system.attributes.movement.all")],
        options: {
          transfer: false,
          expiry: "targetStart",
          durationSeconds: 6,
          durationRounds: 1,
          description: "Prone, and Speed 0 until the start of its next turn.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: this.ddbParser.originalName,
        max: "1",
        period: "lr",
      }),
    };
  }

}
