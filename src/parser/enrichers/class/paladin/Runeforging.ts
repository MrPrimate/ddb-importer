import DDBEnricherData from "../../data/DDBEnricherData";
import { runesFor, type TRune } from "./_Runes";

/**
 * Runeforging (Oath of the Ebon Blade, World of Warcraft Death Knight): on a Long Rest a rune goes on
 * a held melee weapon. One "Inscribe" activity per rune applies a transferred rune effect: Blood is
 * Temporary Hit Points (Cha mod + Paladin levels) on inscribing, each Long Rest and each kill; Frost
 * and Unholy add the rune's extra damage as its own activity (their ignoring of Cold / Necrotic
 * Resistance is a dnd5e 6.1 damage rule, left to the description on this dnd5e version).
 */
export default class Runeforging extends DDBEnricherData {

  get runes(): TRune[] {
    return runesFor({
      names: [
        ...(this.ddbParser._chosen ?? []).map((choice) => choice.label),
        this.data.name,
        this.ddbParser.originalName,
      ],
      html: this.ddbParser.ddbDefinition?.description,
      subclassName: this.ddbParser.subKlass,
    });
  }

  get levels(): string {
    return `@classes.${this.classIdentifier("Paladin")}.levels`;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: `Inscribe ${this.runes[0]} Rune`,
      activationType: "longRest",
      targetType: "self",
    };
  }

  #inscribe(rune: TRune): IDDBAdditionalActivity {
    return {
      init: {
        name: `Inscribe ${rune} Rune`,
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateActivation: true,
        generateTarget: true,
        generateConsumption: false,
        activationOverride: { type: "longRest", value: 1, condition: "" },
        targetOverride: { override: true, affects: { type: "self" } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = this.runes.slice(1).map((rune) => this.#inscribe(rune));
    if (this.runes.includes("Blood")) {
      activities.push({
        init: {
          name: "Blood Rune: Temporary Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "You inscribe the rune, finish a Long Rest with it, or reduce an enemy to 0 Hit Points while wielding it",
          },
          targetOverride: { override: true, affects: { type: "self" } },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: `@abilities.cha.mod + ${this.levels}`,
            types: ["temphp"],
          }),
        },
      });
    }
    if (this.runes.includes("Frost")) {
      activities.push({
        init: {
          name: "Frost Rune: Extra Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "You hit with the Light property's extra attack while wielding the inscribed weapon",
          },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["cold"] })],
        },
      });
    }
    if (this.runes.includes("Unholy")) {
      activities.push({
        init: {
          name: "Unholy Rune: Extra Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "The first creature you hit each turn with the inscribed Heavy weapon",
          },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "max(1, @abilities.cha.mod)", types: ["necrotic"] })],
        },
      });
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [];
    for (const rune of this.runes) {
      effects.push({
        name: `${rune} Rune`,
        activityMatch: `Inscribe ${rune} Rune`,
        options: {
          transfer: true,
          disabled: true,
          description: `The ${rune} rune is inscribed on your weapon.`,
        },
        changes: [],
      });
    }
    return effects;
  }

}
