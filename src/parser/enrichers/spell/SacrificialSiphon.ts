import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Sacrificial Siphon: a Charisma save. The cursed target subtracts 1d4 from attack rolls and ability
 * checks; the caster takes a Reaction for 10 Temporary Hit Points when it is damaged. On a success
 * the caster gains 5 Temporary Hit Points and the target subtracts 1d4 from ability checks briefly.
 */
export default class SacrificialSiphon extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Spell",
      data: {
        save: {
          ability: ["cha"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
      },
    };
  }

  /** DDB's temporary hit point modifier would add its own heal; the reaction and save activities replace it. */
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  static tempHPActivity(name: string, amount: string, activationType: TActivationCost): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      },
      build: {
        generateDamage: false,
        generateHealing: true,
        generateConsumption: false,
        noSpellslot: true,
        noeffect: true,
        activationOverride: {
          type: activationType,
          value: 1,
          condition: "",
        },
        healingPart: DDBEnricherData.basicDamagePart({ bonus: amount, type: "temphp", scalingMode: "none" }),
      },
      overrides: {
        targetType: "self",
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      SacrificialSiphon.tempHPActivity("Siphon (Reaction)", "10", "reaction"),
      SacrificialSiphon.tempHPActivity("Saved: Temporary Hit Points", "5", "special"),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Siphoned",
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.rsak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.bonuses.abilities.check"),
        ],
      },
    ];
  }

}
