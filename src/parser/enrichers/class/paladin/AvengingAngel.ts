import DDBEnricherData from "../../data/DDBEnricherData";

export default class AvengingAngel extends DDBEnricherData {

  // the 2014 feature calls it an aura of menace
  get #auraName(): string {
    return this.is2014 ? "Aura of Menace" : "Frightful Aura";
  }

  /**
   * The aura's save. In 2024 it is DDB's "Avenging Angel" action, which ships with no DC and the
   * feature's own activation and use; the 2014 action is a plain utility, so its save is built here.
   */
  get #auraSave(): IDDBAdditionalActivity {
    const condition = this.is2014
      ? "The first time an enemy enters the aura or starts its turn there during a battle"
      : "Whenever an enemy starts its turn in your Aura of Protection";
    const save = { ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } };
    if (this.is2014) {
      return {
        init: { name: this.#auraName, type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          saveOverride: save,
          activationOverride: { type: "special", value: null, condition },
          targetOverride: { affects: { count: "1", type: "enemy", choice: false, special: "" } },
        },
        overrides: { noConsumeTargets: true },
      };
    }
    return {
      action: { name: "Avenging Angel", type: "class" },
      overrides: {
        name: this.#auraName,
        noConsumeTargets: true,
        activationType: "special",
        activationCondition: condition,
        targetType: "enemy",
        targetCount: "1",
        data: { save },
      },
    };
  }

  get activity(): IDDBActivityData | null {
    if (this.ddbParser.isAction) {
      return null;
    }
    return {
      name: "Activate",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: this.is2014 ? "action" : "bonus",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.ddbParser.isAction) {
      return [];
    }
    const activities: IDDBAdditionalActivity[] = [
      this.#auraSave,
    ];
    // only the 2024 feature can be restored with a level 5 spell slot
    if (!this.is2014) {
      activities.push(
        {
          init: {
            name: "Spend Spell Slot to Restore Use",
            type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
          },
          build: {
            generateConsumption: true,
            generateTarget: true,
            generateActivation: true,
            generateUtility: true,
            activationOverride: {
              type: "none",
              value: null,
              condition: "",
            },
            consumptionOverride: {
              targets: [
                {
                  type: "itemUses",
                  target: "",
                  value: "-1",
                  scaling: { mode: "", formula: "" },
                },
                {
                  type: "spellSlots",
                  value: "1",
                  target: "5",
                  scaling: { mode: "", formula: "" },
                },
              ],
            },
          },
        },
      );
    }
    return activities;
  }

  get effects(): IDDBEffectHint[] {
    if (this.ddbParser.isAction) {
      return [];
    }
    return [{
      name: "Avenging Angel (Wings)",
      options: {
        // an hour in 2014, ten minutes in 2024
        durationSeconds: this.is2014 ? 3600 : 600,
      },
      activitiesMatch: ["Activate"],
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("60", 2, "system.attributes.movement.fly"),
      ],
    }, {
      // the aura's failed save; the parser's own status was cleared with the auto effects
      name: "Avenging Angel: Frightened",
      activityMatch: this.#auraName,
      statuses: ["Frightened"],
      options: {
        transfer: false,
        durationSeconds: 60,
        description: "Frightened for 1 minute or until it takes any damage. Attack rolls against it have Advantage.",
      },
      daeSpecialDurations: ["isDamaged"],
      ac5eChanges: [
        DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.advantage"),
      ],
    }];
  }

  get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({ type: "class", name: "Avenging Angel", max: "1", period: "lr" });
    return {
      uses,
      data: {
        name: "Avenging Angel",
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }

}
