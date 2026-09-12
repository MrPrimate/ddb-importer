import DDBEnricherData from "../../data/DDBEnricherData";

export default class EventHorizon extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate",
      targetType: "enemy",
      activationType: "action",
      activationCondition: "Lasts 1 minute (concentration)",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: "Ongoing Save",
          }),
        ],
        range: {
          units: "self",
        },
        target: {
          template: {
            type: "radius",
            size: "30",
            units: "ft",
            count: "",
            contiguous: false,
            width: "",
            height: "",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Ongoing Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: true,
          onSave: "half",
          saveOverride: {
            ability: ["str"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, type: "force" }),
          ],
          activationOverride: {
            type: "special",
            condition: "Hostile creature starts its turn in the sphere",
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
        name: "Event Horizon: Held",
        activityMatch: "Ongoing Save",
        options: {
          expiry: "targetStart",
          description: "Speed 0 until the start of its next turn (on a success, every foot of movement costs 2 extra feet this turn).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 50),
        ],
      },
    ];
  }

}
