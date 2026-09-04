import DDBEnricherData from "../data/DDBEnricherData";

export default class LightningRing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      id: "ddbLightningRing",
      targetType: "creature",
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { type: "radius", size: "10", units: "ft" },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityName: "Ring Save",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ring Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          noSpellslot: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          onSave: "half",
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, type: "lightning", scalingMode: "none" }),
            DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, type: "thunder", scalingMode: "none" }),
          ],
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "Enters the Emanation or ends its turn there",
          noTemplate: true,
          data: { range: { units: "spec" }, behaviors: [] },
        },
      },
      {
        init: { name: "Lightning Line", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
          onSave: "half",
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, type: "lightning", scalingMode: "none" }),
          ],
          targetOverride: {
            affects: { type: "creature" },
            template: { type: "line", size: "60", width: "5", units: "ft" },
          },
        },
        overrides: {
          targetType: "creature",
          activationType: "action",
          data: { range: { units: "self" }, behaviors: [] },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Deafened by Lightning Ring",
        activityMatch: "Ring Save",
        statuses: ["Deafened"],
        options: { durationSeconds: 60 },
      },
    ];
  }

}
