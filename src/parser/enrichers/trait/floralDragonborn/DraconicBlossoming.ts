import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * A Bonus Action self buff: 1d4 regained at the start of each of your turns for
 * 1 minute, and any creature that attacks you must first pass a Charisma save
 * or pick a different target.
 */
export default class DraconicBlossoming extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Draconic Blossoming",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        duration: {
          override: true,
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attacker's Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          activationOverride: {
            type: "special",
            condition: "A creature targets you with an attack while Draconic Blossoming is active",
          },
          saveOverride: {
            ability: ["cha"],
            dc: {
              calculation: "cha",
              formula: "",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Draconic Blossoming",
        activityMatch: "Draconic Blossoming",
        options: {
          durationSeconds: 60,
          description: "You regain 1d4 Hit Points at the start of each of your turns. A creature that attacks you must first succeed on a Charisma saving throw or choose a different target.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Draconic Blossoming (Start of Turn Regeneration),turn=start,savingThrow=false,damageRoll=1d4,damageType=healing,condition=@attributes.hp.value > 0,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
