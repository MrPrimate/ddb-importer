import { DICTIONARY } from "../../../config/_module.mjs";

export default class AutoEffects {

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
    effect.name = name;
    effect.statuses = [];
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

}
