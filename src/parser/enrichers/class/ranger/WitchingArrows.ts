import DDBEnricherData from "../../data/DDBEnricherData";

export default class WitchingArrows extends DDBEnricherData {

  get type() {
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this._shotActivity({ name: "Arcing Shot", saveAbility: "dex", damageType: "lightning", onSave: "half" }),
      this._shotActivity({ name: "Entangling Shot", saveAbility: "str", damageType: "piercing", onSave: "full" }),
      this._shotActivity({ name: "Hexing Shot", saveAbility: "wis", damageType: "psychic", onSave: "half" }),
      this._shotActivity({ name: "Viper Shot", saveAbility: "con", damageType: "poison", onSave: "half" }),
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Witching Arrows: Restrained",
        activityMatch: "Entangling Shot",
        statuses: ["restrained"],
        options: {
          durationSeconds: 60,
          description: "Restrained for 1 minute. The creature repeats the save at the end of each of its turns, ending the effect on itself on a success.",
        },
      },
      {
        name: "Witching Arrows: Charmed",
        activityMatch: "Hexing Shot",
        statuses: ["charmed"],
        options: {
          durationSeconds: 60,
          description: "Charmed for 1 minute. The creature repeats the save at the end of each of its turns, ending the effect on a success.",
        },
      },
      {
        name: "Witching Arrows: Frightened",
        activityMatch: "Hexing Shot",
        statuses: ["frightened"],
        options: {
          durationSeconds: 60,
          description: "Frightened for 1 minute. The creature repeats the save at the end of each of its turns, ending the effect on a success.",
        },
      },
      {
        name: "Witching Arrows: Poisoned",
        activityMatch: "Viper Shot",
        statuses: ["poisoned"],
        options: {
          durationSeconds: 60,
          description: "Poisoned for 1 minute. The creature repeats the save at the end of each of its turns, ending the effect on a success.",
        },
      },
    ];
  }

}
