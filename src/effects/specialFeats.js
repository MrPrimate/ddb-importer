import { baseItemEffect } from "./effects.js";
import utils from "../utils.js";
import logger from "../logger.js";
import { configureDependencies } from "./macros.js";
import { kiEmptyBodyEffect } from "./feats/kiEmptyBody.js";
import { warCasterEffect } from "./feats/warCaster.js";
import { rageEffect } from "./feats/rage.js";

export function baseFeatEffect(document, label) {
  return {
    label,
    icon: document.img,
    changes: [],
    duration: {},
    tint: "",
    transfer: false,
    disabled: false,
    flags: {
      dae: {
        transfer: false,
        stackable: false,
      },
      ddbimporter: {
        disabled: false,
      },
    },
  };
}

var installedModules;

export function featEffectModules() {
  if (installedModules) return installedModules;
  const midiQolInstalled = utils.isModuleInstalledAndActive("midi-qol");
  const advancedMacrosInstalled = utils.isModuleInstalledAndActive("advanced-macros");
  const aboutTime = utils.isModuleInstalledAndActive("about-time");
  const itemMacroInstalled = utils.isModuleInstalledAndActive("itemacro");
  const timesUp = utils.isModuleInstalledAndActive("times-up");
  const daeInstalled = utils.isModuleInstalledAndActive("dae");
  const convinientEffectsInstalled = utils.isModuleInstalledAndActive("dfreds-convenient-effects");

  const activeAurasInstalled = utils.isModuleInstalledAndActive("ActiveAuras");
  const atlInstalled = utils.isModuleInstalledAndActive("ATL");
  const tokenAurasInstalled = utils.isModuleInstalledAndActive("token-auras");
  const tokenMagicInstalled = utils.isModuleInstalledAndActive("tokenmagic");
  const autoAnimationsInstalled = utils.isModuleInstalledAndActive("autoanimations");
  installedModules = {
    hasCore:
      itemMacroInstalled &&
      midiQolInstalled &&
      advancedMacrosInstalled &&
      aboutTime &&
      timesUp &&
      daeInstalled &&
      convinientEffectsInstalled,
    midiQolInstalled,
    itemMacroInstalled,
    advancedMacrosInstalled,
    aboutTime,
    timesUp,
    daeInstalled,
    convinientEffectsInstalled,
    atlInstalled,
    tokenAurasInstalled,
    tokenMagicInstalled,
    activeAurasInstalled,
    autoAnimationsInstalled,
  };
  return installedModules;
}

var configured;
/**
 * These are effects that can't be generated dynamically and have extra requirements
 */
export async function generateExtraEffects(document) {
  if (!document.effects) document.effects = [];

  // check that we can gen effects
  const deps = featEffectModules();
  if (!deps.hasCore) {
    logger.warn(
      "Sorry, you're missing some required modules for spell effects. Please install them and try again.",
      deps
    );
    return document;
  }
  if (!configured) {
    configured = configureDependencies();
  }

  const name = document.flags.ddbimporter.originalName || document.name;
  switch (name) {
    case "Empty Body":
    case "Ki: Empty Body": {
      document = await kiEmptyBodyEffect(document);
      break;
    }
    case "Rage": {
      document = rageEffect(document);
      break;
    }
    case "War Caster":
    case "Warcaster": {
      document = warCasterEffect(document);
      break;
    }
    // no default
  }
  return document;
}

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
export function featureEffectAdjustment(document) {
  const midiQolInstalled = utils.isModuleInstalledAndActive("midi-qol");
  switch (document.name) {
    // if using active auras add the aura effect
    case "Aura of Courage":
    case "Aura of Protection": {
      document.effects.forEach((effect) => {
        if (effect.label.includes("Constant Effects")) {
          effect.flags.ActiveAuras = {
            aura: "Allies",
            radius: 10,
            isAura: true,
            inactive: false,
            hidden: false,
          };
        }
      });
      break;
    }
    case "Unarmored Movement": {
      document.effects.forEach((effect) => {
        if (effect.label.includes("Constant Effects")) {
          effect.changes = [
            {
              key: "data.attributes.movement.walk",
              value: "max(10+(ceil(((@classes.monk.levels)-5)/4))*5,10)",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
          ];
        }
      });
      break;
    }
    case "Potent Cantrip": {
      let effect = baseItemEffect(document, `${document.name}`);
      effect.changes.push({
        key: "flags.midi-qol.potentCantrip",
        value: "1",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 20,
      });
      document.effects.push(effect);
      break;
    }
    case "Bardic Inspiration": {
      if (midiQolInstalled) {
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
      }
      break;
    }
    // no default
  }

  return document;
}
