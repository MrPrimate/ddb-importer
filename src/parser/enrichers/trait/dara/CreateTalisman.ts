import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Dara: an action makes a talisman (once per long rest, lasting an hour or until activated). Sun
 * grants Dash or Disengage as a bonus action, Earth drops its holder to 1 hit point instead of 0,
 * and Moon, placed on a weapon, adds radiant damage equal to your level to its next hit.
 */
export default class CreateTalisman extends DDBEnricherData {

  static talisman(name: string, type: IDDBActivityType, condition: string, activation: TActivationCost = "special", extra: Partial<IDDBAdditionalActivity["build"]> = {}): IDDBAdditionalActivity {
    return {
      init: { name, type },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        activationOverride: { type: activation, value: 1, condition },
        ...extra,
      },
      overrides: { targetType: "creature", noConsumeTargets: true, noTemplate: true },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Talisman",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      CreateTalisman.talisman("Sun Talisman", DDBEnricherData.ACTIVITY_TYPES.UTILITY, "The holder takes the Dash or Disengage action", "bonus"),
      CreateTalisman.talisman("Earth Talisman", DDBEnricherData.ACTIVITY_TYPES.UTILITY, "The holder is reduced to 0 hit points but not killed outright (drops to 1 instead)"),
      CreateTalisman.talisman("Moon Talisman", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, "The weapon bearing the talisman hits a target", "special", {
        generateDamage: true,
        damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@details.level", types: ["radiant"] })],
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "race",
        name: "Create Talisman",
        max: "1",
        period: "lr",
      }),
    };
  }

}
