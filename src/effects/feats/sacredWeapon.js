import { baseFeatEffect } from "../specialFeats.js";
import { generateATLChange } from "../effects.js";

export function sacredWeaponEffect(document) {

  if (CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules.atlInstalled) {
    let lightEffect = baseFeatEffect(document, `${name} (Light Effect)`, { transfer: false });
    lightEffect.changes.push(generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '5'));
    lightEffect.changes.push(generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'));
    lightEffect.changes.push(generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'));
    const lightAnimation = '{"type": "sunburst", "speed": 2,"intensity": 4}';
    lightEffect.changes.push(generateATLChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, lightAnimation));
    foundry.utils.setProperty(lightEffect, "duration.seconds", 60);
    lightEffect._id = foundry.utils.randomID();
    document.effects.push(lightEffect);
    // foundry.utils.setProperty(enchantmentEffect, "flags.dnd5e.enchantment.riders.effect", [lightEffect._id]);
    // KNOWN_ISSUE_4_0: Add light effect to activity
  }

  return document;
}
