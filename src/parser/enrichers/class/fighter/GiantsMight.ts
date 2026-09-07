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
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.width", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.height", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
        ],
        options: {
          durationSeconds: 60,
        },
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
        // this effect is only active while transformed, which gates the AC5e opt-in too
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d6; oncePerTurn; optin; actionType.mwak || actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }
}

