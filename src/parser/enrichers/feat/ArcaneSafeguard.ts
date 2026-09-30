import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU origin feat: Resistance can be cast as a Bonus Action a proficiency-bonus number of times per
 * long rest. The cast activity overrides the spell's activation; the cantrip itself arrives as a
 * DDB spell grant, so the cached copy stays out of the spellbook.
 */
export default class ArcaneSafeguard extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bonus Action Resistance",
      activationType: "bonus",
      // a cast activity shows its spell's activation unless told to override it
      overrideActivation: true,
      addItemConsume: true,
      addSpellUuid: "Resistance",
      data: {
        spell: {
          spellbook: false,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Sheltering Aid",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateTarget: true,
          generateActivation: true,
          activationOverride: { type: "action", value: null, condition: "When you take the Help action" },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["temphp"] }),
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "ally",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "@prof",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
