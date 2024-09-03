import { baseFeatEffect } from "../specialFeats.js";
import { generateATLChange, baseEnchantmentEffect } from "../effects.js";

export function sacredWeaponEffect(document) {
  if (document.system.actionType === null) return document;
  const name = document.name.split(":").pop();
  document.system.actionType = "ench";

  document.system.damage.parts = [];
  document.system.chatFlavor = "";

  let enchantmentEffect = baseEnchantmentEffect(document, `${name}`, {
    description: `The weapon shines with Sacred Energy.`,
    durationSeconds: 60,
  });
  enchantmentEffect.changes.push(
    {
      key: "name",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `{}, (${name})`,
      priority: 20,
    },
    {
      key: "system.properties",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "mgc",
      priority: 20,
    },
    {
      key: "system.attack.bonus",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "@abilities.cha.mod",
      priority: 20,
    },
  );

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
    foundry.utils.setProperty(enchantmentEffect, "flags.dnd5e.enchantment.riders.effect", [lightEffect._id]);
  } else {
    const macroToggle = `<br><p>[[/ddbifunc functionName="sacredWeaponLight" functionType="feat"]]{Toggle Sacred Weapon Light}</div></p>`;
    document.system.description.value += macroToggle;
    if (document.system.description.chat !== "") document.system.description.chat += macroToggle;
  }

  document.effects.push(enchantmentEffect);

  return document;
}
