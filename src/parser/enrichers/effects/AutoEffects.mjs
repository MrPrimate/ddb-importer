import { DICTIONARY } from "../../../config/_module.mjs";
import { DDBHelper, logger, utils } from "../../../lib/_module.mjs";
import { DDBDescriptions } from "../../lib/_module.mjs";
import ChangeHelper from "./ChangeHelper.mjs";
import MidiEffects from "./MidiEffects.mjs";

export default class AutoEffects {

  static EXCLUDED = DICTIONARY.effects.excludedModifiers;

  static getEffectExcludedModifiers(type, features, ac) {
    let modifiers = [];

    if (type !== "item") {
      // features represent core non ac features
      if (features) {
        modifiers = modifiers.concat(AutoEffects.EXCLUDED.common, AutoEffects.EXCLUDED.speedMonk);
        if (!["race"].includes(type)) {
          modifiers = modifiers.concat(AutoEffects.EXCLUDED.senses, AutoEffects.EXCLUDED.speedSet, AutoEffects.EXCLUDED.speedBonus);
        }
      }
      // here ac represents the more exotic ac effects that set limits and change base
      modifiers = modifiers.concat(AutoEffects.EXCLUDED.acBonus);
      if (ac) {
        modifiers = modifiers.concat(AutoEffects.EXCLUDED.ac);
      }
    }

    // items are basically their own thing, all or nuffin
    if (type === "item") {
      modifiers = modifiers.concat(
        AutoEffects.EXCLUDED.senses,
        AutoEffects.EXCLUDED.common,
        AutoEffects.EXCLUDED.abilityBonus,
        AutoEffects.EXCLUDED.languages,
        AutoEffects.EXCLUDED.proficiencyBonus,
        AutoEffects.EXCLUDED.speedSet,
        AutoEffects.EXCLUDED.speedBonus,
        AutoEffects.EXCLUDED.speedMonk,
        AutoEffects.EXCLUDED.ac,
        AutoEffects.EXCLUDED.acBonus,
      );
    }
    return modifiers;
  }

  static ChangeHelper = ChangeHelper;

  static effectModules() {
    if (CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules) {
      return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
    }
    const midiQolInstalled = game.modules.get("midi-qol")?.active ?? false;
    const timesUp = game.modules.get("times-up")?.active ?? false;
    const daeInstalled = game.modules.get("dae")?.active ?? false;

    const activeAurasInstalled = game.modules.get("ActiveAuras")?.active ?? false;
    const atlInstalled = game.modules.get("ATL")?.active ?? false;
    const tokenMagicInstalled = game.modules.get("tokenmagic")?.active ?? false;
    const autoAnimationsInstalled = game.modules.get("autoanimations")?.active ?? false;
    const chrisInstalled = game.modules.get("chris-premades")?.active ?? false;
    const vision5eInstalled = game.modules.get("vision-5e")?.active ?? false;

    CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules = {
      hasCore: midiQolInstalled && timesUp && daeInstalled,
      hasMonster: midiQolInstalled && timesUp && daeInstalled,
      midiQolInstalled,
      timesUp,
      daeInstalled,
      atlInstalled,
      tokenMagicInstalled,
      activeAurasInstalled,
      autoAnimationsInstalled,
      chrisInstalled,
      vision5eInstalled,
    };
    return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
  }

  static generateBasicEffectDuration(document, activity) {
    let duration = {
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

  static BaseEffect(document, name,
    { transfer = true, disabled = false, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null } = {},
  ) {
    let effect = {
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
          transfer,
          stackable: "noneName",
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

  static SpellEffect(document, label,
    { transfer = false, disabled = false, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null } = {},
  ) {
    const options = { transfer, disabled, description, durationSeconds, durationRounds, durationTurns };
    return AutoEffects.BaseEffect(document, label, options);
  }

  static FeatEffect(document, label,
    { transfer = false, disabled = false, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null } = {},
  ) {
    return AutoEffects.BaseEffect(document, label, { transfer, disabled, description, durationSeconds, durationRounds, durationTurns });
  }

  static MonsterFeatureEffect(document, label,
    { transfer = false, disabled = false } = {},
  ) {
    return AutoEffects.BaseEffect(document, label, { transfer, disabled });
  }


  static ItemEffect(document, label,
    { transfer = true, disabled = false, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null } = {},
  ) {
    const effect = AutoEffects.BaseEffect(document, label, { transfer, disabled, description, durationSeconds, durationRounds, durationTurns });
    return effect;
  }

  static addVision5eStub(document) {
    if (!document.effects) document.effects = [];

    const name = document.flags?.ddbimporter?.originalName ?? document.name;

    // if document name in Vision effects then add effect
    if (DICTIONARY.effects.vision5e[name]
      && document.type === DICTIONARY.effects.vision5e[name].type
      && !document.effects.some((e) => e.name === DICTIONARY.effects.vision5e[name].effectName)
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

  static forceDocumentEffect(document) {
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


  static getGenericConditionAffectData(modifiers, condition, typeId, forceNoMidi = false) {
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
        .concat(CONFIG.DDB.conditions.map((a) => {
          return {
            id: a.definition.id,
            type: 4,
            name: a.definition.name,
            slug: a.definition.slug,
          };
        }))
      : CONFIG.DDB.damageAdjustments;

    const result = DDBHelper
      .filterModifiersOld(modifiers, condition, null, restrictions)
      .filter((modifier) => {
        const ddbLookup = ddbAdjustments.find((d) => d.type == typeId && d.slug === modifier.subType);
        if (!ddbLookup) return false;
        return DICTIONARY.character.damageAdjustments.some((adj) =>
          adj.type === typeId
          && ddbLookup.id === adj.id
          && (foundry.utils.hasProperty(adj, "foundryValues") || foundry.utils.hasProperty(adj, "foundryValue")),
        );
      })
      .map((modifier) => {
        const ddbLookup = ddbAdjustments.find((d) => d.type == typeId && d.slug === modifier.subType);
        const entry = DICTIONARY.character.damageAdjustments.find((adj) =>
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
      .filter((adjustment) => adjustment !== undefined)
      .map((result) => {
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


  static getStatusConditionEffect({ text = null, status = null, nameHint = null, flags = {} } = {}) {
    const parsedStatus = status ?? DDBDescriptions.parseStatusCondition({ text });
    if (!parsedStatus.success) return null;

    const effect = {
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
      AutoEffects.ChangeHelper.addStatusEffectChange({ effect, statusName: parsedStatus.group4Condition });
      DDBDescriptions.addSpecialDurationFlagsToEffect(effect, parsedStatus.match);
      if (nameHint) effect.name = `${nameHint}: ${parsedStatus.group4Condition}`;
      else effect.name = `Status: ${parsedStatus.group4Condition}`;
    } else if (parsedStatus.condition === "dead") {
      AutoEffects.ChangeHelper.addStatusEffectChange({ effect, statusName: "Dead" });
    } else {
      logger.debug(`Odd condition ${status.condition} found`, {
        text,
        nameHint,
        status,
      });
      return null;
    }

    return effect;
  }

  static getStatusEffect({ ddbDefinition, foundryItem, labelOverride } = {}) {
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
    }
    return effect;
  }

  static addSimpleConditionEffect(document, condition, { disabled, transfer } = {}) {
    document.effects = [];
    const effect = this.ItemEffect(document, `${document.name} - ${utils.capitalize(condition)}`, { disabled, transfer });
    ChangeHelper.addStatusEffectChange({ effect, statusName: condition });
    document.effects.push(effect);
    return document;
  }

  static generateBaseSkillEffect(id, label) {
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