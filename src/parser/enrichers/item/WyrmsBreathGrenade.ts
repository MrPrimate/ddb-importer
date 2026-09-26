import DDBEnricherData from "../data/DDBEnricherData";
import { regionTrigger } from "../data/RegionBuilders";

const ONGOING = "Ongoing Save";

interface IGrenadeMetal {
  saveAbility: string;
  dc: string;
  effectName: string | null;
}

/**
 * The metal grenades share one enricher and read their save from the name prefix; the unprefixed
 * catalogue item gets a plain DC 15 Constitution save. Throw places a 15-foot sphere where the
 * grenade lands, up to 60 feet away, for 1 minute, and rolls nothing on impact: the region fires
 * "Ongoing Save" at a creature that moves into the cloud for the first time on a turn or starts its
 * turn there (being inside as it billows out is not entering). A failure applies the metal's rider: Brass Unconscious (ends on damage with DAE), Copper slowed
 * (AC, Dexterity save and speed penalties), Gold disadvantage through midi-qol only, Silver
 * Paralyzed, Bronze 2d6 bludgeoning and Prone. Being flung, collision damage, the Brass hit point
 * immunity and lost actions are left to the table.
 */
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
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Throw",
      targetType: "creature",
      activationType: "action",
      removeDamageParts: true,
      // what the cloud does to a creature belongs to the roll the region fires
      noeffect: true,
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          // a cloud where the grenade lands, not an emanation following whoever was clicked
          template: {
            count: "1",
            contiguous: false,
            type: "sphere",
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
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            enterOn: "movement",
            activityName: ONGOING,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const metal = this.metal;
    const isBronze = this.name.startsWith("Bronze");
    return [regionTrigger(ONGOING, {
      condition: "Enters the cloud for the first time on its turn or starts its turn there",
      save: { ability: [metal.saveAbility], dc: metal.dc },
      onSave: "none",
      ...(isBronze
        ? { damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, type: "bludgeoning" })] }
        : {}),
    })];
  }

  override get effects(): IDDBEffectHint[] {
    const isBronze = this.name.startsWith("Bronze");
    if (isBronze) {
      return [
        {
          name: "Prone (Bronze Wyrm's Breath)",
          activityMatch: ONGOING,
          statuses: ["Prone"],
          options: {
            transfer: false,
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
            activityMatch: ONGOING,
            statuses: ["Unconscious"],
            daeSpecialDurations: ["isDamaged"],
            options: {
              transfer: false,
              expiry: "targetStart",
              description: "Unconscious until the start of its next turn. A creature with 80 or more hit points is immune; ends if the creature takes damage or another creature uses an action to wake it.",
            },
          },
        ];
      case "Slowed (Copper Wyrm's Breath)":
        return [
          {
            name: metal.effectName,
            activityMatch: ONGOING,
            changes: [
              DDBEnricherData.ChangeHelper.addChange("-2", 20, "system.attributes.ac.bonus"),
              DDBEnricherData.ChangeHelper.addChange("-2", 20, "system.abilities.dex.save.roll.bonus"),
              DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
            ],
            options: {
              transfer: false,
              expiry: "targetStart",
              description: "As the slow spell until the start of its next turn: -2 AC and Dexterity saves, half speed, no reactions, one action or bonus action only (action economy is manual).",
            },
          },
        ];
      case "Weakened (Gold Wyrm's Breath)":
        return [
          {
            name: metal.effectName,
            activityMatch: ONGOING,
            midiChanges: [
              DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.all"),
            ],
            options: {
              transfer: false,
              expiry: "targetEnd",
              description: "Disadvantage on ability checks, attack rolls, and saving throws; deals half damage with Strength-based attacks (halving is manual) until the end of its next turn.",
            },
          },
        ];
      case "Paralysed (Silver Wyrm's Breath)":
        return [
          {
            name: metal.effectName,
            activityMatch: ONGOING,
            statuses: ["Paralyzed"],
            options: { transfer: false, expiry: "targetStart" },
          },
        ];
      default:
        return [];
    }
  }

}
