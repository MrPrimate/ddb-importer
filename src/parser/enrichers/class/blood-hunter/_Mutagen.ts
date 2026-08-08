import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";

interface IMutagenLevel {
  min: number | null;
  max: number | null;
}

interface IMutagenEffectArgs {
  changes?: IActiveEffectChangeData[];
  midiChanges?: IActiveEffectChangeData[];
  ac5eChanges?: IActiveEffectChangeData[];
  atlChanges?: IActiveEffectChangeData[];
  durationSeconds?: number | null;
  level?: IMutagenLevel;
  nameSuffix?: string;
  idPostfix?: number;
  description?: string;
}

/**
 * Shared behaviour for the Order of the Mutant's mutagen formulas.
 *
 * DDB ships each chosen formula as an optional feature document named
 * "Formula: <Name>". Consuming a mutagen is a bonus action, and every formula
 * pairs a benefit with a side effect, so each document gets a single utility
 * activity and one effect (or one per level band) hung off it.
 *
 * Mutagencraft's effects last "until you finish a short or long rest", which
 * dnd5e cannot express, so no duration is set unless the formula's own text
 * gives one - only Aether and Reconstruction do.
 *
 * The leading underscore keeps this out of the name lookup - pascalCase of a
 * DDB feature name can never start with one - while still being exported by
 * the generated barrel.
 */
export default class _Mutagen extends _BloodHunter {

  static CONSUME_NAME = "Consume Mutagen";

  static CLASS_IDENTIFIER = "blood-hunter";

  /** The three bands used by the ability score formulas: +3, then +4 at 11th, +5 at 18th. */
  static SCORE_BANDS: { bonus: number; level: IMutagenLevel }[] = [
    { bonus: 3, level: { min: null, max: 10 } },
    { bonus: 4, level: { min: 11, max: 17 } },
    { bonus: 5, level: { min: 18, max: null } },
  ];

  /** "Formula: Celerity" -> "Celerity". `name` is a field on the base class, so it cannot be a getter. */
  get mutagenName(): string {
    return this.name.replace(/^Formula:\s*/i, "").trim();
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  /**
   * DDB attaches the formula's own modifiers to the document; left alone they become a
   * permanent transfer effect granting the mutagen's benefit whether or not it is consumed.
   */
  get clearAutoEffects(): boolean {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      name: _Mutagen.CONSUME_NAME,
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      noTemplate: true,
      noConsumeTargets: true,
      data: {
        // without an identifier the effect level bands below resolve against character
        // level rather than blood hunter level
        visibility: {
          identifier: _Mutagen.CLASS_IDENTIFIER,
        },
        duration: {
          units: "inst",
        },
      },
    };
  }

  /** The effect applied by consuming this mutagen. */
  mutagenEffect({
    changes = [],
    midiChanges = [],
    ac5eChanges = [],
    atlChanges = [],
    durationSeconds = null,
    level = undefined,
    nameSuffix = "",
    idPostfix = 0,
    description = undefined,
  }: IMutagenEffectArgs = {}): IDDBEffectHint {
    const options: IDDBEffectOptions = {
      transfer: false,
    };
    if (durationSeconds) options.durationSeconds = durationSeconds;
    if (description) options.description = description;

    const data: I5eEffectData = {
      _id: utils.namedIDStub(this.mutagenName, { prefix: "ddbMut", postfix: idPostfix }),
    };
    if (level) {
      data.flags = {
        ddbimporter: {
          effectIdLevel: level,
        },
      };
    }

    const hint: IDDBEffectHint = {
      name: `Mutagen: ${this.mutagenName}${nameSuffix}`,
      activityMatch: _Mutagen.CONSUME_NAME,
      options,
      changes,
      data,
    };

    if (midiChanges.length > 0) hint.midiChanges = midiChanges;
    if (ac5eChanges.length > 0) hint.ac5eChanges = ac5eChanges;
    if (atlChanges.length > 0) hint.atlChanges = atlChanges;

    return hint;
  }

  static rollMode(ability: string, type: "check" | "save", advantage: boolean): IActiveEffectChangeData {
    const mode = advantage
      ? CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE
      : CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE;
    return DDBEnricherData.ChangeHelper.unsignedAddChange(`${mode}`, 20, `system.abilities.${ability}.${type}.roll.mode`);
  }

  static advantageCheck(ability: string): IActiveEffectChangeData {
    return _Mutagen.rollMode(ability, "check", true);
  }

  static disadvantageCheck(ability: string): IActiveEffectChangeData {
    return _Mutagen.rollMode(ability, "check", false);
  }

  static disadvantageSave(ability: string): IActiveEffectChangeData {
    return _Mutagen.rollMode(ability, "save", false);
  }

  static damageVulnerabilityChange(damageType: string): IActiveEffectChangeData {
    return DDBEnricherData.ChangeHelper.unsignedAddChange(damageType.toLowerCase(), 20, "system.traits.dv.value");
  }

  static conditionImmunityChange(condition: string): IActiveEffectChangeData {
    return DDBEnricherData.ChangeHelper.unsignedAddChange(condition.toLowerCase(), 20, "system.traits.ci.value");
  }

  /**
   * Raise a score and its maximum by the same amount. Plain adds on both keys: the DAE aware
   * `min(@abilities.x.max, ...)` form used by the auto generator exists to cap a bonus at the
   * existing maximum, which is the opposite of what a mutagen does.
   */
  static abilityScoreChanges(ability: string, bonus: number): IActiveEffectChangeData[] {
    return [
      DDBEnricherData.ChangeHelper.addChange(`${bonus}`, 5, `system.abilities.${ability}.value`),
      DDBEnricherData.ChangeHelper.addChange(`${bonus}`, 3, `system.abilities.${ability}.max`),
    ];
  }

  /**
   * The three banded effects shared by Celerity, Potency and Sagacity: +3 to a score and its
   * maximum, rising to +4 at 11th level and +5 at 18th, with one disadvantage as the side effect.
   */
  scoreMutagenEffects(ability: string, sideEffect: IActiveEffectChangeData): IDDBEffectHint[] {
    return _Mutagen.SCORE_BANDS.map((band, index) => this.mutagenEffect({
      idPostfix: index,
      level: band.level,
      nameSuffix: ` (+${band.bonus})`,
      changes: [
        ..._Mutagen.abilityScoreChanges(ability, band.bonus),
        sideEffect,
      ],
    }));
  }

}
