import DDBEnricherData from "../../data/DDBEnricherData";

interface IHellstorm {
  label: string;
  ability: string;
  parts: I5eDamagePart[];
  effectName: string;
  statuses: string[];
  description: string;
}

/**
 * Master of Hell summons one of three hellstorms, picked as a choice on DDB. A character import
 * carries the choice and gets that storm; without one (muncher) every storm is built.
 */
export default class MasterOfHell extends DDBEnricherData {

  static HELLSTORMS: IHellstorm[] = [
    {
      label: "Inferno",
      ability: "dex",
      parts: [
        DDBEnricherData.basicDamagePart({ number: 5, denomination: 10, type: "fire" }),
        DDBEnricherData.basicDamagePart({ number: 5, denomination: 10, type: "necrotic" }),
      ],
      effectName: "Burning",
      statuses: [],
      description: "At the end of each of your turns, make a Dexterity saving throw, taking 1d10 fire damage plus 1d10 necrotic damage on a failure, or ending the effect on a success. This hellfire can't be extinguished by nonmagical means.",
    },
    {
      label: "Pestilence",
      ability: "con",
      parts: [
        DDBEnricherData.basicDamagePart({ number: 5, denomination: 10, type: "poison" }),
        DDBEnricherData.basicDamagePart({ number: 5, denomination: 10, type: "necrotic" }),
      ],
      effectName: "Pestilence: Poisoned",
      statuses: ["Poisoned"],
      description: "",
    },
    {
      label: "Darkness",
      ability: "con",
      parts: [
        DDBEnricherData.basicDamagePart({ number: 10, denomination: 10, type: "cold" }),
      ],
      effectName: "Darkness: Blinded",
      statuses: ["Blinded"],
      description: "Blinded while you remain in the storm's area.",
    },
  ];

  get hellstorms(): IHellstorm[] {
    const chosen = MasterOfHell.HELLSTORMS.filter((storm) =>
      this.ddbParser._chosen?.some((c) => c.label === storm.label),
    );
    return chosen.length > 0 ? chosen : MasterOfHell.HELLSTORMS;
  }

  hellstormActivity(storm: IHellstorm): IDDBActivityData {
    return {
      name: storm.label,
      activationType: "action",
      addItemConsume: true,
      rangeType: "ft",
      rangeValue: 150,
      data: {
        target: {
          override: true,
          template: {
            count: "",
            contiguous: false,
            type: "sphere",
            size: "50",
            width: "",
            height: "",
            units: "ft",
          },
          affects: {
            count: "",
            type: "enemy",
            choice: false,
          },
        },
        duration: {
          units: "minute",
          value: "1",
        },
        save: {
          ability: [storm.ability],
          dc: { calculation: "cha", formula: "" },
        },
        damage: {
          onSave: "half",
          parts: storm.parts,
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return this.hellstormActivity(this.hellstorms[0]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.hellstorms.slice(1).map((storm) => ({
      init: {
        name: storm.label,
        type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      },
      build: {
        generateActivation: true,
        generateConsumption: true,
        generateRange: true,
        generateTarget: true,
        generateDuration: true,
        generateSave: true,
        generateDamage: true,
      },
      overrides: this.hellstormActivity(storm),
    }));
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return this.hellstorms.map((storm) => ({
      name: storm.effectName,
      activityMatch: storm.label,
      statuses: storm.statuses,
      options: {
        durationSeconds: 60,
        ...(storm.description ? { description: storm.description } : {}),
      },
    }));
  }

}
