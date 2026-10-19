import DDBEnricherData from "../../data/DDBEnricherData";

export default class Maneuver extends DDBEnricherData {
  // get addAutoAdditionalActivities() {
  //   return true;
  // }

  extraDamageActivity(): IDDBAdditionalActivity {
    return {
      init: {
        name: "Damage",
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateDamage: true,
        generateTarget: true,
        generateRange: true,
        generateConsumption: false,
        generateActivation: true,
        activationOverride: {
          type: "special",
          value: 1,
          condition: "",
        },
      },
      overrides: {
        targetType: "creature",
        activationType: "special",
        data: {
          damage: {
            onSave: "none",
            parts: [
              DDBEnricherData.basicDamagePart({
                customFormula: this.diceString,
                types: DDBEnricherData.allDamageTypes(),
              }),
            ],
          },
        },
      },
    };
  }

  /**
   * A superiority die added to AC: dnd5e's `ac.bonus` resolves dice to 0, so the activity rolls the
   * die and one effect per possible result (to a d12) is applied by hand, as the official
   * Battle Master content does.
   */
  rolledAcEffects(label: string, options: IDDBEffectHint["options"] = {}): IDDBEffectHint[] {
    return Array.from({ length: 12 }, (_, i) => i + 1).map((value) => ({
      name: `${label}: AC +${value}`,
      options: { transfer: false, ...options },
      changes: [DDBEnricherData.ChangeHelper.unsignedAddChange(`${value}`, 20, "system.attributes.ac.bonus")],
    }));
  }

  get diceString(): string {
    if (this.isClass("Fighter")) {
      if (this.hasClassFeature({ featureName: "Combat Superiority", className: "Fighter" })) {
        return "@scale.battle-master.combat-superiority-die";
      }
    }
    // maneuvers from feat
    return "1d6";
  }

  get ignoredConsumptionActivities(): string[] {
    return ["Damage"];
  }

  override get override(): IDDBOverrideData {
    const name = this.data.name
      .replace("Maneuver Options:", "Maneuver:")
      .replace("Maneuvers:", "Maneuver:")
      .replace("Martial Adept: ", "Maneuver: ");
    return {
      ignoredConsumptionActivities: this.ignoredConsumptionActivities,
      data: {
        name,
        system: {
          type: {
            "value": "class",
            "subtype": "maneuver",
          },
          uses: {
            spent: null,
            max: "",
            recovery: [],
          },
        },
      },
    };
  }

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      addItemConsume: true,
      activationType: "special",
      data: {
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.diceString,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

}
