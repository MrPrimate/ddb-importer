import DDBEnricherData from "../data/DDBEnricherData";

export default class FireShield extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Chill Shield",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Warm Shield",
        },
      },
      {
        init: {
          name: "On Hit Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "A creature within 5 feet of you hits you with a melee attack roll",
          data: {
            damage: {
              parts: [DDBEnricherData.basicDamagePart({
                number: 2,
                denomination: 8,
                types: ["fire", "cold"],
              })],
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      { name: "Chill Shield", damageType: "fire" },
      { name: "Warm Shield", damageType: "cold" },
    ].map((data) => {
      return {
        name: data.name,
        activityMatch: data.name,
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(data.damageType, 0),
        ],
        options: {
          durationSeconds: 600,
        },
        onUseMacroChanges: [
          { macroPass: "isDamaged", macroType: "spell", macroName: "fireShield.js", document: this.data },
        ],
        data: {
          flags: {
            dae: {
              selfTargetAlways: true,
            },
          },
        },
      };
    });
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "fireShield.js",
    };
  }

}
