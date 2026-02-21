import { DICTIONARY } from "../../../config/_module";
import { logger, utils } from "../../../lib/_module";
import { DDBDescriptions, DDBModifiers, SystemHelpers } from "../../lib/_module";
import ChangeHelper from "./ChangeHelper";
import MidiEffects from "./MidiEffects";

interface EffectModules {
  daeInstalled: boolean;
  midiQolInstalled: boolean;
  atlInstalled: boolean;
  [key: string]: any;
}

interface EffectDuration {
  seconds: number | null;
  startTime: number | null;
  rounds: number | null;
  turns: number | null;
  startRound: number | null;
  startTurn: number | null;
}

interface BaseEffectOptions {
  transfer?: boolean;
  disabled?: boolean;
  description?: string | null;
  durationSeconds?: number | null;
  durationRounds?: number | null;
  durationTurns?: number | null;
  showIcon?: boolean | null;
}

interface StatusConditionEffectOptions {
  text?: string | null;
  status?: any;
  nameHint?: string | null;
  flags?: any;
}

interface StatusEffectOptions {
  ddbDefinition?: any;
  foundryItem?: any;
  labelOverride?: string;
}

interface SimpleConditionOptions {
  disabled?: boolean;
  transfer?: boolean;
}

export default class AutoEffects {

  static effectModules(): EffectModules {
    return SystemHelpers.effectModules();
  }

  static generateBasicEffectDuration(document: any, activity?: any): EffectDuration {
    let duration: EffectDuration = {
      seconds: null,
      startTime: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    };
    const docData = document?.system?.duration ?? activity?.duration;
    if (!docData) return duration;

    switch (docData?.units) {
      case "turn":
        duration.turns = docData.value;
        break;
      case "round":
        duration.rounds = docData.value;
        break;
      case "hour":
        duration.seconds = docData.value * 60 * 60;
        break;
      case "minute":
        duration.rounds = docData.value * 10;
        break;
      // no default
    }
    return duration;
  }

  static BaseEffect(document: any, name: string,
    { transfer = true, disabled = false, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null, showIcon = false }: BaseEffectOptions = {},
  ): any {
    let effect: any = {
      img: document.img,
      name,
      statuses: [],
      changes: [],
      duration: {},
      // duration: {
      //   seconds: null,
      //   startTime: null,
      //   rounds: null,
      //   turns: null,
      //   startRound: null,
      //   startTurn: null,
      // },
      tint: "",
      transfer,
      disabled,
      // origin: origin,
      flags: {
        dae: {
          showIcon,
          transfer,
          stackable: "noneNameOnly",
          // armorEffect: true
        },
        ddbimporter: {
          disabled,
        },
        "midi-qol": { // by default force CE effect usage to off
          forceCEOff: true,
        },
        core: {},
      },
    };
    effect.duration = AutoEffects.generateBasicEffectDuration(document);
    effect.description = description ?? "";
    if (durationSeconds) effect.duration.seconds = durationSeconds;
    if (durationRounds) effect.duration.rounds = durationRounds;
    if (durationTurns) effect.duration.turns = durationTurns;
    return effect;
  }

  static SpellEffect(document: any, label: string,
    { transfer = false, disabled = false, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null, showIcon = null }: BaseEffectOptions = {},
  ): any {
    const options = { transfer, disabled, description, durationSeconds, durationRounds, durationTurns, showIcon };
    return AutoEffects.BaseEffect(document, label, options);
  }

  static FeatEffect(document: any, label: string,
    { transfer = false, disabled = false, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null, showIcon = null }: BaseEffectOptions = {},
  ): any {
    return AutoEffects.BaseEffect(document, label, { transfer, disabled, description, durationSeconds, durationRounds, durationTurns, showIcon });
  }

  static MonsterFeatureEffect(document: any, label: string,
    { transfer = false, disabled = false, showIcon = null }: BaseEffectOptions = {},
  ): any {
    return AutoEffects.BaseEffect(document, label, { transfer, disabled, showIcon });
  }


  static ItemEffect(document: any, label: string,
    { transfer = true, disabled = false, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null, showIcon = null }: BaseEffectOptions = {},
  ): any {
    const effect = AutoEffects.BaseEffect(document, label, { transfer, disabled, description, durationSeconds, durationRounds, durationTurns, showIcon });
    return effect;
  }

  static addVision5eStub(document: any): any {
    if (!document.effects) document.effects = [];

    const name = document.flags?.ddbimporter?.originalName ?? document.name;

    // if document name in Vision effects then add effect
    if (DICTIONARY.effects.vision5e[name]
      && document.type === DICTIONARY.effects.vision5e[name].type
      && !document.effects.some((e: any) => e.name === DICTIONARY.effects.vision5e[name].effectName)
    ) {
      const effect = AutoEffects.SpellEffect(document, DICTIONARY.effects.vision5e[name].effectName);
      effect.transfer = DICTIONARY.effects.vision5e[name].transfer;
      document.effects.push(effect);
      if (DICTIONARY.effects.vision5e[name].type === "spell") {
        document.system.target.type = "self";
      }
      foundry.utils.setProperty(document, "flags.ddbimporter.effectsApplied", true);
    }
    return document;
  }

  static forceDocumentEffect(document: any): any {
    if (document.effects.length > 0
      || foundry.utils.hasProperty(document.flags, "dae")
      || foundry.utils.hasProperty(document.flags, "midi-qol.onUseMacroName")
    ) {
      document = MidiEffects.applyDefaultMidiFlags(document);
      foundry.utils.setProperty(document, "flags.ddbimporter.effectsApplied", true);
      if (!foundry.utils.getProperty(document, "flags.midi-qol.forceCEOn")) {
        foundry.utils.setProperty(document, "flags.midi-qol.forceCEOff", true);
      }
    }
    return document;
  }


  static getGenericConditionAffectData(modifiers: any[], condition: string, typeId: number, forceNoMidi: boolean = false): any[] {
    const restrictions = [
      "",
      null,
      "While within 20 feet",
      "Dwarf Only",
      "While Not Incapacitated",
      // "As an Action", this is a timed/limited effect, dealt with elsewhere
      "While Staff is Held",
      "Helm has at least one ruby remaining",
      "while holding",
      "While Held",
    ];

    const ddbAdjustments = typeId === 4
      ? [
        { id: 11, type: 4, name: "Poisoned", slug: "poison" },
        { id: 16, type: 4, name: "Diseased", slug: "diseased" },
        { id: 16, type: 4, name: "Diseased", slug: "disease" },
      ]
        .concat(CONFIG.DDB.conditions.map((a: any) => {
          return {
            id: a.definition.id,
            type: 4,
            name: a.definition.name,
            slug: a.definition.slug,
          };
        }))
      : CONFIG.DDB.damageAdjustments;

    const result = DDBModifiers
      .filterModifiersOld(modifiers, condition, null, restrictions)
      .filter((modifier: any) => {
        const ddbLookup = ddbAdjustments.find((d: any) => d.type == typeId && d.slug === modifier.subType);
        if (!ddbLookup) return false;
        return DICTIONARY.actor.damageAdjustments.some((adj: any) =>
          adj.type === typeId
          && ddbLookup.id === adj.id
          && (foundry.utils.hasProperty(adj, "foundryValues") || foundry.utils.hasProperty(adj, "foundryValue")),
        );
      })
      .map((modifier: any) => {
        const ddbLookup = ddbAdjustments.find((d: any) => d.type == typeId && d.slug === modifier.subType);
        const entry = DICTIONARY.actor.damageAdjustments.find((adj: any) =>
          adj.type === typeId
          && ddbLookup.id === adj.id,
        );
        if (!entry) return undefined;
        const valueData = foundry.utils.hasProperty(entry, "foundryValues")
          ? foundry.utils.getProperty(entry, "foundryValues")
          : foundry.utils.hasProperty(entry, "foundryValue")
            ? { value: entry.foundryValue }
            : undefined;
        return valueData;
      })
      .filter((adjustment: any) => adjustment !== undefined)
      .map((result: any) => {
        if (game.modules.get("midi-qol")?.active && result.midiValues && !forceNoMidi) {
          return {
            value: result.value.concat(result.midiValues),
            bypass: result.bypass,
          };
        } else {
          return result;
        }
      });

    return result;
  }


  static getStatusConditionEffect({ text = null, status = null, nameHint = null, flags = {} }: StatusConditionEffectOptions = {}): any | null {
    const parsedStatus = status ?? DDBDescriptions.parseStatusCondition({ text });
    if (!parsedStatus.success) return null;

    const effect: any = {
      name: "",
      changes: [],
      flags: foundry.utils.mergeObject({
        dae: {
          specialDuration: parsedStatus.specialDurations,
        },
      }, flags),
      statuses: [],
      duration: parsedStatus.duration,
    };

    if (parsedStatus.group4) {
      ChangeHelper.addStatusEffectChange({ effect, statusName: parsedStatus.condition });
      DDBDescriptions.addSpecialDurationFlagsToEffect(effect, parsedStatus.match);
      if (nameHint) effect.name = `${nameHint}: ${parsedStatus.conditionName}`;
      else effect.name = `Status: ${parsedStatus.conditionName}`;
      effect.img = CONFIG.DND5E.conditionTypes[parsedStatus.condition]?.icon ?? null;
    } else if (parsedStatus.condition === "dead") {
      ChangeHelper.addStatusEffectChange({ effect, statusName: "Dead" });
      effect.img = "systems/dnd5e/icons/svg/statuses/dead.svg";
    } else {
      logger.debug(`Odd condition ${status.condition} found`, {
        text,
        nameHint,
        status,
      });
      return null;
    }

    if (parsedStatus.riderStatuses) {
      effect.statuses.push(...parsedStatus.riderStatuses);
    }

    return effect;
  }

  static getStatusEffect({ ddbDefinition, foundryItem, labelOverride }: StatusEffectOptions = {}): any | null {
    if (!foundryItem.effects) foundryItem.effects = [];

    const text = ddbDefinition.description ?? ddbDefinition.snippet ?? "";

    const conditionResult = DDBDescriptions.parseStatusCondition({ text, nameHint: labelOverride });

    if (!conditionResult.success) return null;
    const conditionEffect = AutoEffects.getStatusConditionEffect({ status: conditionResult, nameHint: labelOverride });
    if (!conditionEffect) return null;

    const effectLabel = (labelOverride ?? conditionEffect.name ?? foundryItem.name ?? conditionResult.condition);
    let effect = AutoEffects.BaseEffect(foundryItem, effectLabel, {
      transfer: false,
      description: `Apply status ${conditionResult.condition}`,
    });
    effect.changes.push(...conditionEffect.changes);
    effect.statuses.push(...conditionEffect.statuses);
    if (conditionEffect.name && conditionEffect.name !== "") effect.name = conditionEffect.name;
    effect.flags = foundry.utils.mergeObject(effect.flags, conditionEffect.flags);
    if (conditionEffect.duration.seconds) effect.duration.seconds = conditionEffect.duration.seconds;
    if (conditionEffect.duration.rounds) effect.duration.rounds = conditionEffect.duration.rounds;

    if (!effect.name || effect.name === "") {
      const condition = utils.capitalize(conditionResult.condition);
      effect.name = `Status: ${condition}`;
      effect.img = CONFIG.DND5E.conditionTypes[conditionResult.condition]?.icon;
    }
    return effect;
  }

  static addSimpleConditionEffect(document: any, condition: string, { disabled, transfer }: SimpleConditionOptions = {}): any {
    document.effects = [];
    const effect = this.ItemEffect(document, `${document.name} - ${utils.capitalize(condition)}`, { disabled, transfer });
    ChangeHelper.addStatusEffectChange({ effect, statusName: condition });
    document.effects.push(effect);
    return document;
  }

  static generateBaseSkillEffect(id: string, label: string): any {
    const mockItem = {
      img: "icons/svg/up.svg",
    };
    let skillEffect = this.ItemEffect(mockItem, label);
    skillEffect.flags.dae = {};
    skillEffect.flags.ddbimporter.characterEffect = true;
    skillEffect.origin = `Actor.${id}`;
    delete skillEffect.transfer;
    return skillEffect;
  }

}
