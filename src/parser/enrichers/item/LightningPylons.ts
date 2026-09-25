import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The wall between two electrified pylons rolls its save as it appears, so electrifying is the
 * save, placed as a wall up to 20 feet long. The same save is rolled again by hand for a creature
 * that enters the wall or ends its turn within 5 feet of it.
 */
export default class LightningPylons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Electrify",
      targetType: "creature",
      activationType: "bonus",
      activationCondition: "A charged pylon within 5 feet; creatures made of metal or wearing metal armor save with Disadvantage. Repeat for a creature that enters the wall or ends its turn within 5 feet of it",
      noConsumeTargets: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 5, denomination: 8, types: ["lightning"] }),
      ],
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
        damage: { onSave: "half" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "wall", size: "20", width: "1", height: "10" },
        },
        range: { override: true, value: "5", units: "ft" },
        duration: { override: true, value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Touch an Electrified Pylon", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["lightning"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Touches an electrified pylon or hits it with a metal melee weapon: roll once per connected pylon",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lightning Pylons: Speed 0",
        activityMatch: "Electrify",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 50, "system.attributes.movement.all"),
        ],
        options: {
          transfer: false,
          expiry: "targetStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Speed 0 until the start of its next turn. A creature that saves has its Speed halved instead.",
        },
      },
    ];
  }

}
