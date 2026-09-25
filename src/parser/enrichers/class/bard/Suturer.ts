import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * College of Fleshweaving. Three uses of a Bardic Inspiration die: temporary
 * hit points, a thread that restrains, and a paralysing needle strike.
 */
export default class Suturer extends DDBEnricherData {

  static INSPIRATION = "Bardic Inspiration";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Suture",
      activationType: "special",
      addItemConsume: true,
      itemConsumeTargetName: Suturer.INSPIRATION,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.bard.inspiration",
          types: ["temphp"],
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Unspool",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateEffects: true,
          saveOverride: {
            ability: ["str"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: Suturer.INSPIRATION,
          data: {
            damage: { onSave: "none" },
            visibility: { level: { min: 5, max: null } },
          },
        },
      },
      {
        init: {
          name: "Acupuncture",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          attackOverride: {
            ability: "spellcasting",
            type: {
              value: "melee",
              classification: "spell",
            },
          },
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration.die",
              types: ["piercing"],
            }),
          ],
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: Suturer.INSPIRATION,
          data: {
            visibility: { level: { min: 10, max: null } },
          },
        },
      },
      {
        init: {
          name: "Save vs Paralysis",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateEffects: true,
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          activationOverride: {
            type: "special",
            value: null,
            condition: "Hit by Acupuncture",
          },
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            visibility: { level: { min: 10, max: null } },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained by Thread",
        activityMatch: "Unspool",
        options: {
          // the restrain lasts a minute with a save at the end of each of the target's turns
          // (the OverTime flag below); a pseudo expiry would null the counted duration
          expiry: "turnStart",
          durationSeconds: 60,
        },
        statuses: ["Restrained"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Suturer (Action Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=str,savingThrow=true,saveRemove=true,killAnim=true,actionSave=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Acupuncture Paralysis",
        activityMatch: "Save vs Paralysis",
        options: {
          expiry: "targetEnd",
        },
        statuses: ["Paralyzed"],
      },
    ];
  }

}
