import DDBEnricherData from "../../data/DDBEnricherData";

export default class AuraOfWar extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Activate Aura of War",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Aura of War (Damage Bonus)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
        },
        overrides: {
          name: "Aura of War (Damage Bonus)",
          activationType: "none",
          noConsumeTargets: true,
          noTemplate: true,
          targetType: "creature",
          data: {
            range: {
              units: "special",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 4,
                  types: ["acid", "cold", "fire", "lightning", "thunder"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of War",
        activityMatch: "Activate Aura of War",
        daeStackable: "none",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "30",
              isAura: true,
              ignoreSelf: false,
              inactive: false,
              hidden: false,
              displayTemp: true,
              type: "undead; fiend",
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "30",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.rwak.damage"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
