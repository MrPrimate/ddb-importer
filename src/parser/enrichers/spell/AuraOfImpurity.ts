import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. DDB records the aura as a sphere, so it is restated as a
 * 30-foot emanation on the caster, and the save a creature makes when it enters the aura or
 * starts its turn there is a free roll made by hand.
 * It harms creatures of the caster's choice, so the roll is aimed at enemies.
 */
export default class AuraOfImpurity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the aura does to a creature belongs to the free roll, not to the cast
      noeffect: true,
      data: {
        target: {
          override: true,
          affects: { type: "enemy" },
          template: { contiguous: false, units: "ft", type: "radius", size: "30", count: "1" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ongoing Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the aura for the first time on its turn or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "enemy" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Drained",
        activityMatch: "Ongoing Save",
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.rsak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.bonuses.abilities.check"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.bonuses.abilities.save"),
        ],
        options: {
          transfer: false,
          expiry: "targetEnd",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Subtracts 1d4 from every ability check, attack roll and saving throw, and regains only half of any Hit Points, until the end of its next turn.",
        },
      },
    ];
  }

}
