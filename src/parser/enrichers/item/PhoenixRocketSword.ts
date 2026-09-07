import DDBEnricherData from "../data/DDBEnricherData";

export default class PhoenixRocketSword extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Flame Jet",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: true,
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          includeBaseDamage: false,
          onSave: "half",
          activationOverride: {
            type: "action",
            value: 1,
            condition: "Speak the command word and expend 1 to 5 charges",
          },
          saveOverride: {
            ability: ["dex"],
            dc: {
              calculation: "",
              formula: "16",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, type: "fire", scalingMode: "whole", scalingNumber: 1 }),
          ],
          targetOverride: {
            override: true,
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
            template: {
              count: "",
              contiguous: false,
              type: "cone",
              size: "15",
              width: "",
              height: "",
              units: "ft",
            },
          },
          rangeOverride: {
            override: true,
            value: "",
            units: "self",
          },
        },
        overrides: {
          addScalingMode: "amount",
          addConsumptionScalingMax: "4",
        },
      },
      {
        init: {
          name: "Rocket",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: true,
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          includeBaseDamage: false,
          onSave: "none",
          activationOverride: {
            type: "action",
            value: 1,
            condition: "Pushed 20 feet per charge expended (you can choose to fail); the bludgeoning damage applies if you strike something, and a struck creature makes the same save",
          },
          saveOverride: {
            ability: ["str"],
            dc: {
              calculation: "",
              formula: "11 + @scaling",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "bludgeoning", scalingMode: "whole", scalingNumber: 1 }),
          ],
          targetOverride: {
            override: true,
            affects: {
              count: "",
              type: "self",
              choice: false,
              special: "",
            },
            template: {
              count: "",
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "",
            },
          },
          rangeOverride: {
            override: true,
            value: "",
            units: "self",
          },
        },
        overrides: {
          addScalingMode: "amount",
          addConsumptionScalingMax: "4",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone (Rocket Impact)",
        activityMatch: "Rocket",
        statuses: ["Prone"],
        options: {
          transfer: false,
          description: "Knocked prone by striking a creature or object while rocketing.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbPhoenixRocketSword">
<p><strong>Implementation Details</strong></p>
<p>Flame Jet and Rocket are one action: use both at the same charge count and untick consumption on the second card. The push save DC is 10 + charges expended.</p>
</section>`,
    };
  }

}
