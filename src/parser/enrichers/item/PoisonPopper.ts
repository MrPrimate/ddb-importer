import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Throwing the fruit rolls nothing: it places a 10-foot-radius cloud for 1 minute. The save is
 * its own activity, rolled by hand against a creature that enters it or starts its turn there.
 */
export default class PoisonPopper extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Throw",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "sphere", size: "10" },
        },
        range: { override: true, value: "60", units: "ft" },
        duration: { override: true, value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Noxious Gas Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "13" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["poison"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the cloud for the first time on a turn or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "half" } },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned (Poison Popper)",
        activityMatch: "Noxious Gas Save",
        statuses: ["Poisoned"],
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 50, "system.attributes.movement.all"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "turn=end, saveAbility=con, saveDC=13, label=Poisoned by Poison Popper",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Poisoned with halved speed for 1 minute. Repeat the save at the end of each turn, ending the effect on a success.",
        },
      },
    ];
  }

}
