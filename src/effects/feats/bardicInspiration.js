import { baseItemEffect } from "../effects.js";

export function bardicInspirationEffect(document) {
  document.system.damage.parts = [];
  let inspiredEffect = baseItemEffect(document, "Inspired");

  const diceString = "@scale.bard.bardic-inspiration";
  inspiredEffect.changes.push(
    {
      key: "flags.midi-qol.optional.bardicInspiration.attack.all",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: diceString,
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.bardicInspiration.save.all",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: diceString,
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.bardicInspiration.check.all",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: diceString,
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.bardicInspiration.skill.all",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: diceString,
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
  foundry.utils.setProperty(inspiredEffect, "flags.dae.transfer", false);
  foundry.utils.setProperty(inspiredEffect, "flags.dae.stackable", false);
  foundry.utils.setProperty(inspiredEffect, "flags.dae.macroRepeat", "none");
  foundry.utils.setProperty(inspiredEffect, "flags.dae.specialDuration", []);

  if (document.flags.ddbimporter.subclass === "College of Valor") {
    inspiredEffect.changes.push(
      {
        key: "flags.midi-qol.optional.bardicInspiration.damage.all",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: diceString,
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.bardicInspiration.ac.all",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: diceString,
        priority: "20",
      }
    );
  }

  document.effects.push(inspiredEffect);

  foundry.utils.setProperty(document, "flags.midi-qol.effectActivation", false);
  return document;
}

