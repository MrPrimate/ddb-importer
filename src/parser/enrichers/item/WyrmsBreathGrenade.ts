import DDBEnricherData from "../data/DDBEnricherData";

interface IGrenadeMetal {
  saveAbility: string;
  dc: string;
  effectName: string | null;
}

export default class WyrmsBreathGrenade extends DDBEnricherData {

  static METALS: Record<string, IGrenadeMetal> = {
    "Brass": { saveAbility: "con", dc: "16", effectName: "Drowsy (Brass Wyrm's Breath)" },
    "Bronze": { saveAbility: "str", dc: "15", effectName: null },
    "Copper": { saveAbility: "con", dc: "15", effectName: "Slowed (Copper Wyrm's Breath)" },
    "Gold": { saveAbility: "con", dc: "16", effectName: "Weakened (Gold Wyrm's Breath)" },
    "Silver": { saveAbility: "con", dc: "17", effectName: "Paralysed (Silver Wyrm's Breath)" },
  };

  get metal(): IGrenadeMetal {
    const key = Object.keys(WyrmsBreathGrenade.METALS).find((m) => this.name.startsWith(m));
    // the un-prefixed catalogue item ("effects vary by metal") gets the generic save base
    return key ? WyrmsBreathGrenade.METALS[key] : { saveAbility: "con", dc: "15", effectName: null };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    const metal = this.metal;
    const isBronze = this.name.startsWith("Bronze");
    return {
      name: "Throw",
      targetType: "creature",
      activationType: "action",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "15",
            units: "ft",
          },
        },
        range: {
          override: true,
          value: "60",
          units: "ft",
        },
        duration: {
          override: true,
          value: "1",
          units: "minute",
        },
        save: {
          ability: [metal.saveAbility],
          dc: {
            calculation: "",
            formula: metal.dc,
          },
        },
        ...(isBronze
          ? {
            damage: {
              onSave: "none",
              parts: [
                DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, type: "bludgeoning" }),
              ],
            },
          }
          : {}),
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const isBronze = this.name.startsWith("Bronze");
    if (isBronze) {
      return [
        {
          name: "Prone (Bronze Wyrm's Breath)",
          statuses: ["Prone"],
          options: {
            description: "Flung up to 60 feet from the centre of the sphere and knocked prone; collision damage is manual.",
          },
        },
      ];
    }
    const metal = this.metal;
    if (!metal.effectName) return [];
    switch (metal.effectName) {
      case "Drowsy (Brass Wyrm's Breath)":
        return [
          {
            name: metal.effectName,
            statuses: ["Unconscious"],
            daeSpecialDurations: ["turnStart", "isDamaged"],
            options: {
              description: "Unconscious until the start of its next turn. A creature with 80 or more hit points is immune; ends if the creature takes damage or another creature uses an action to wake it.",
            },
          },
        ];
      case "Slowed (Copper Wyrm's Breath)":
        return [
          {
            name: metal.effectName,
            daeSpecialDurations: ["turnStart"],
            changes: [
              DDBEnricherData.ChangeHelper.addChange("-2", 20, "system.attributes.ac.bonus"),
              DDBEnricherData.ChangeHelper.addChange("-2", 20, "system.abilities.dex.save.roll.bonus"),
              DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
            ],
            options: {
              description: "As the slow spell until the start of its next turn: -2 AC and Dexterity saves, half speed, no reactions, one action or bonus action only (action economy is manual).",
            },
          },
        ];
      case "Weakened (Gold Wyrm's Breath)":
        return [
          {
            name: metal.effectName,
            daeSpecialDurations: ["turnEnd"],
            midiChanges: [
              DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.all"),
            ],
            options: {
              description: "Disadvantage on ability checks, attack rolls, and saving throws; deals half damage with Strength-based attacks (halving is manual) until the end of its next turn.",
            },
          },
        ];
      case "Paralysed (Silver Wyrm's Breath)":
        return [
          {
            name: metal.effectName,
            statuses: ["Paralyzed"],
            daeSpecialDurations: ["turnStart"],
          },
        ];
      default:
        return [];
    }
  }

}
