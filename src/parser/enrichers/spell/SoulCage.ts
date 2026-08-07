import DDBEnricherData from "../data/DDBEnricherData";

export default class SoulCage extends DDBEnricherData {

  get _stealLifeActivity(): IDDBActivityData {
    return {
      name: "Steal Life",
      addItemConsume: true,
      noSpellslot: true,
      targetSelf: true,
      overrideTarget: true,
      activationType: "bonus",
      overrideActivation: true,
    };
  }

  get _castActivity(): IDDBActivityData {
    return {
      name: "Cage Soul",
      addItemConsume: true,
      itemConsumeValue: "-6",
      noeffect: true,
    };
  }

  get activity(): IDDBActivityData {
    return this.ddbEnricher?._originalActivity?.type === "heal"
      ? this._stealLifeActivity
      : this._castActivity;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Query Soul",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDamage: false,
          generateConsumption: true,
          noSpellslot: true,
          noeffect: true,
          activationOverride: { type: "special", condition: "No action required" },
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        init: {
          name: "Borrow Experience",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDamage: false,
          generateConsumption: true,
          noSpellslot: true,
          noeffect: true,
          activationOverride: { type: "bonus", condition: "" },
        },
        overrides: {
          addItemConsume: true,
          targetSelf: true,
          overrideTarget: true,
        },
      },
      {
        init: {
          name: "Eyes of the Dead",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDamage: false,
          generateConsumption: true,
          noSpellslot: true,
          noeffect: true,
          activationOverride: { type: "action", condition: "" },
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 6,
        max: "6",
        recovery: [],
      },
    };
  }

}
