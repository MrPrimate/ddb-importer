import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. "Cast" places a 10-foot "radius" emanation that follows
 * the caster, and the region fires Ring Save when a creature enters it or ends its turn there,
 * held to one save a turn by the default once-per-turn gate. Nothing branches on the printing.
 * Ring Save targets enemies, so only hostile tokens are affected, and the caster is skipped; it
 * carries the Deafened effect. Lightning Line is a separate action. Declining to force a hostile
 * creature, or forcing a neutral one, is left to the table.
 */
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
            excludeSelf: true,
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
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
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
          // "you can force that creature" - the region fires at hostile creatures only
          targetType: "enemy",
          activationType: "special",
          activationCondition: "Enters the Emanation or ends its turn there",
          noTemplate: true,
          data: { range: { units: "spec" }, behaviors: [] },
        },
      },
      {
        init: { name: "Lightning Line", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
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
