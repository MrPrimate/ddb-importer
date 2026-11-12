import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Aspect of the Horsemen (Oath of the Ebon Blade, World of Warcraft Death Knight) level 20: a 1/LR
 * Bonus Action for 10 minutes, restored with a level 5 slot. While it lasts, a level 4 slot restores
 * a Runic Mastery use, and Runic Power / Runic Mastery may use any rune's option.
 */
export default class AspectOfTheHorsemen extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate",
      activationType: "bonus",
      addItemConsume: true,
      targetType: "self",
      data: {
        duration: { units: "minute", value: "10" },
      },
    };
  }

  #slotRestore(name: string, slot: string, itemTarget: string): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateConsumption: true,
        generateTarget: true,
        generateActivation: true,
        generateUtility: true,
        activationOverride: { type: "none", value: null, condition: "" },
        consumptionOverride: {
          targets: [
            { type: "itemUses", target: itemTarget, value: "-1", scaling: { mode: "", formula: "" } },
            { type: "spellSlots", value: "1", target: slot, scaling: { mode: "", formula: "" } },
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.#slotRestore("Spend Spell Slot to Restore Use", "5", ""),
      // dnd5e resolves a bare identifier through actor.identifiedItems
      this.#slotRestore("Generate Runic Power", "4", "runic-mastery"),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aspect of the Horsemen",
        activityMatch: "Activate",
        options: {
          durationSeconds: 600,
          description: "When you use Runic Power and Runic Mastery, you can choose any rune's effect.",
        },
      },
    ];
  }

}
