import DDBEnricherData from "../../data/DDBEnricherData";

export default class GiantsMight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: DDBEnricherData.allDamageTypes() })],
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.width", "upgrade", 2, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.height", "upgrade", 2, 5),
        ],
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 25, "system.traits.size"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("str"),
        ],
        midiOptionalChanges: [
          {
            name: "giantsMight",
            data: {
              label: "Giant's Might Bonus Damage",
              count: "turn",
              "damage.all": "1d6",
              criticalDamage: "1",
            },
          },
        ],
      },
    ];
  }
}

