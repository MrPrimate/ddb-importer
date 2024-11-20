import { DICTIONARY } from "../../../config/_module.mjs";
import ChangeHelper from "./ChangeHelper.mjs";
import MidiEffects from "./MidiEffects.mjs";

export default class AutoEffects {

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

}
