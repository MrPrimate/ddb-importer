import DDBEnricherData from "../../data/DDBEnricherData";

export default class WitchingArrows extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  private _shotActivity({ name, saveAbility, damageType, onSave }: {
    name: string;
    saveAbility: string;
    damageType: string;
    onSave: string;
  }): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      },
      build: {
        generateSave: true,
        generateDamage: true,
        generateTarget: true,
        generateActivation: true,
        generateConsumption: true,
        damageParts: [
          DDBEnricherData.basicDamagePart({
            number: 2,
            denomination: 6,
            type: damageType,
            scalingMode: "whole",
            scalingNumber: 2,
          }),
        ],
        saveOverride: {
          ability: [saveAbility],
          dc: { calculation: "spellcasting", formula: "" },
        },
        activationOverride: {
          type: "special",
          condition: "Once per turn, when you hit with a ranged attack using a Longbow or Shortbow",
        },
      },
      overrides: {
        targetType: "creature",
        data: {
          damage: {
            onSave,
          },
          consumption: {
            targets: [
              {
                type: "spellSlots",
                value: "1",
                target: "1",
                scaling: {},
              },
            ],
            scaling: {
              allowed: true,
              max: "",
            },
            spellSlot: true,
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this._shotActivity({ name: "Arcing Shot", saveAbility: "dex", damageType: "lightning", onSave: "half" }),
      this._shotActivity({ name: "Entangling Shot", saveAbility: "str", damageType: "piercing", onSave: "full" }),
      this._shotActivity({ name: "Hexing Shot", saveAbility: "wis", damageType: "psychic", onSave: "half" }),
      this._shotActivity({ name: "Viper Shot", saveAbility: "con", damageType: "poison", onSave: "half" }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Witching Arrows: Restrained",
        activityMatch: "Entangling Shot",
        statuses: ["restrained"],
        options: {
          durationSeconds: 60,
          description: "Restrained for 1 minute. The creature repeats the save at the end of each of its turns, ending the effect on itself on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Witching Arrows: Entangling Shot (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=str,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Witching Arrows: Charmed",
        activityMatch: "Hexing Shot",
        statuses: ["charmed"],
        options: {
          durationSeconds: 60,
          description: "Charmed for 1 minute. The creature repeats the save at the end of each of its turns, ending the effect on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Witching Arrows: Hexing Shot (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Witching Arrows: Frightened",
        activityMatch: "Hexing Shot",
        statuses: ["frightened"],
        options: {
          durationSeconds: 60,
          description: "Frightened for 1 minute. The creature repeats the save at the end of each of its turns, ending the effect on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Witching Arrows: Hexing Shot (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Witching Arrows: Poisoned",
        activityMatch: "Viper Shot",
        statuses: ["poisoned"],
        options: {
          durationSeconds: 60,
          description: "Poisoned for 1 minute. The creature repeats the save at the end of each of its turns, ending the effect on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Witching Arrows: Viper Shot (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=con,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
