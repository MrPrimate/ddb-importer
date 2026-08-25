import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpellBlind extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spell Blind",
      targetType: "enemy",
      activationType: "action",
      activationCondition: "Hostile creatures starting their turn within 60 ft; lasts 1 minute (concentration)",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: "5",
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
            size: "60",
            units: "ft",
            count: "",
            contiguous: false,
            width: "",
            height: "",
          },
        },
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
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
          saveOverride: {
            ability: ["con"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          activationOverride: {
            type: "special",
            condition: "Hostile creature starts its turn in the aura",
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
        name: "Blinded",
        activityMatch: "Ongoing Save",
        statuses: ["Blinded"],
        options: {
          durationSeconds: 60,
          description: "Blinded until the empowered Flickering Aura ends.",
        },
      },
    ];
  }

}
