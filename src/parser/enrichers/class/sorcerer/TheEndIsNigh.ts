import DDBEnricherData from "../../data/DDBEnricherData";

export default class TheEndIsNigh extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "The End is Nigh",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
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
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, type: "psychic" }),
            DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, type: "force" }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spend Sorcery Points to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noeffect: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "6",
                target: "sorcery-points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened",
        activityMatch: "The End is Nigh",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 60,
          description: "Frightened for 1 minute; repeat the saving throw at the end of each turn, ending the condition on a success.",
        },
      },
    ];
  }

}
