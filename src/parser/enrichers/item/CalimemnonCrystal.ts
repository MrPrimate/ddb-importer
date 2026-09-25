import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The parser's single save is the once-a-day ray action, reshaped here into the damage ray with
 * the healing ray beside it. The Aura of Cold is a 20-foot emanation toggled with a Magic action;
 * its cold damage is a separate activity rolled by hand for a creature that enters it, ends its
 * turn there or has the emanation move onto it, never for the attuned holder.
 */
export default class CalimemnonCrystal extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Damage Ray",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "Six rays in one Magic action; choose damage or healing for each",
      addItemConsume: true,
      noTemplate: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, bonus: "6", types: ["radiant"] }),
      ],
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "18" } },
        damage: { onSave: "half" },
        range: { override: true, value: "60", units: "ft" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Healing Ray", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          healingPart: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: "2", types: ["healing"] }),
          activationOverride: { type: "special", value: null, condition: "One of the six rays" },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: "60", units: "ft" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
      {
        init: { name: "Aura of Cold", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: false,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "Enable the aura",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "radius", size: "20" },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
        },
      },
      {
        init: { name: "Aura of Cold Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["cold"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the aura or ends its turn there, or the aura moves onto it (once per turn)",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

}
