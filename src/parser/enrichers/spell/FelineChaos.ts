import DDBEnricherData from "../data/DDBEnricherData";

export default class FelineChaos extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({
            number: 4,
            denomination: 6,
            types: ["slashing"],
            scalingNumber: 2,
          })],
        },
        range: {
          units: "ft",
          value: 120,
        },
        target: {
          affects: {
            type: "enemy",
            choice: true,
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "20",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Moving Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        overrides: {
          noSpellslot: true,
          targetType: "creature",
          activationType: "special",
          noTemplate: true,
          data: {
            save: {
              ability: ["con"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            damage: {
              parts: [DDBEnricherData.basicDamagePart({
                number: 2,
                denomination: 6,
                types: ["slashing"],
              })],
            },
          },
        },
      },
      {
        init: {
          name: "End of Turn Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        overrides: {
          noSpellslot: true,
          activationType: "turnEnd",
          targetType: "creature",
          noTemplate: true,
          data: {
            save: {
              ability: ["dex"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Feline Chaos - Prone",
        statuses: ["Prone"],
        activityMatch: "Moving Save",
      },
    ];
  }
}
