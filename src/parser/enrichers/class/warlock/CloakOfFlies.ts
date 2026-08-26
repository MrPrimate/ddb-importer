import DDBEnricherData from "../../data/DDBEnricherData";

export default class CloakOfFlies extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Aura",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "5",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: "Aura Damage",
            excludeSelf: true,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Aura Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ customFormula: "max(0, @abilities.cha.mod)", type: "poison" }),
          ],
          activationOverride: {
            type: "special",
            condition: "Starts its turn in the aura",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
        },
        overrides: {
          data: {
            range: {
              override: true,
              units: "spec",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cloak of Flies",
        activityMatch: "Activate Aura",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("1", 20, "system.skills.itm.roll.mode"),
        ],
        options: {
          description: "Advantage on Charisma (Intimidation) checks, disadvantage on all other Charisma checks.",
        },
      },
    ];
  }

}
