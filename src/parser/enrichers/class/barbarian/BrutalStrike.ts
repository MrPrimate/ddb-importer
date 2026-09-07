import DDBEnricherData from "../../data/DDBEnricherData";

export default class BrutalStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noeffect: true,
      name: "Brutal Strike Damage",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Forceful Blow",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
        },
      },
      {
        init: {
          name: "Hamstrung Blow",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hamstrung",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("-15", 90, "system.attributes.movement.walk"),
        ],
        activityMatch: "Hamstrung Blow",
      },
      {
        name: "Reckless Attack: Brutal Strike Damage",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("@scale.barbarian.brutal-strike", 20, "system.bonuses.mwak.damage"),
        ],
        options: {
          transfer: true,
          disabled: true,
        },
      },
    ];
  }


  override get override(): IDDBOverrideData {
    return {
      uses: {
        "spent": 0,
        "recovery": [
          {
            "period": "turnStart",
            "type": "recoverAll",
          },
        ],
        "max": "1",
      },
    };
  }

}
