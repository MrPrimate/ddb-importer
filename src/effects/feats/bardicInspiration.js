import { baseItemEffect } from "../effects.js";

export function bardicInspirationEffect(document) {
  document.data.damage.parts = [];
  let inspiredEffect = baseItemEffect(document, "Inspired");
  inspiredEffect.changes.push(
    {
      key: "flags.midi-qol.optional.bardicInspiration.attack",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1d@flags.dae.BardicInspirationDice",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.bardicInspiration.save",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1d@flags.dae.BardicInspirationDice",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.bardicInspiration.check",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1d@flags.dae.BardicInspirationDice",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.bardicInspiration.label",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "Bardic Inspiration",
      priority: "20",
    }
  );
  inspiredEffect.transfer = false;
  inspiredEffect.disabled = false;
  setProperty(inspiredEffect, "flags.dae.transfer", false);
  setProperty(inspiredEffect, "flags.dae.stackable", false);
  setProperty(inspiredEffect, "flags.dae.macroRepeat", "none");
  setProperty(inspiredEffect, "flags.dae.specialDuration", []);

  if (document.flags.ddbimporter.subclass === "College of Valor") {
    inspiredEffect.changes.push(
      {
        key: "flags.midi-qol.optional.bardicInspiration.damage",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: "1d@flags.dae.BardicInspirationDice",
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.bardicInspiration.ac",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: "1d@flags.dae.BardicInspirationDice",
        priority: "20",
      }
    );
  }

  document.effects.push(inspiredEffect);

  let diceEffect = baseItemEffect(document, "Bardic Inspiration Dice");
  diceEffect.changes.push({
    key: "flags.dae",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "BardicInspirationDice (floor(@classes.bard.levels/5)+3) * 2",
    priority: "20",
  });
  diceEffect.transfer = true;
  diceEffect.disabled = false;
  setProperty(diceEffect, "flags.dae.transfer", true);
  setProperty(diceEffect, "flags.dae.stackable", false);
  setProperty(diceEffect, "flags.dae.macroRepeat", "none");
  setProperty(diceEffect, "flags.dae.specialDuration", []);
  document.effects.push(diceEffect);
  document.flags["midi-qol"] = {
    onUseMacroName: "",
    effectActivation: false,
    forceCEOff: false,
  };
  return document;
}

