import { baseSpellEffect, generateMacroChange, generateMacroFlags, generateTokenMagicFXChange, spellEffectModules } from "../specialSpells.js";

export function faerieFireEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });
  // MACRO START
  const itemMacroText = `
if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Please enable the Advanced Macros module");
  return;
}
if (!game.modules.get("ATL")?.active) {
  ui.notifications.error("Please enable the Advanced Token Effects module");
  return;
}

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function lightUp(colour) {
  const colours = {
    blue: "#5ab9e2",
    purple: "#844ec6",
    green: "#55d553",
  };
  const version = (game.version ?? game.data.version);
  const preV9 = version.startsWith("0");

  const effect = targetActor.effects.find((e) => e.data.label === lastArg.efData.label);
  const changes = effect.data.changes.concat([
    {
      key: preV9 ? "ATL.lightColor" : "ATL.light.color",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 30,
      value: \`\${colours[colour]}\`,
    },
    {
      key: preV9 ? "ATL.lightAlpha" : "ATL.light.alpha",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 30,
      value: "0.65",
    },
    {
      key: preV9 ? "ATL.dimLight" : "ATL.light.dim",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 30,
      value: "10",
    },
    {
      key: preV9 ? "ATL.lightAnimation" : "ATL.light.animation",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 30,
      value: '{"type": "pulse","speed": 1,"intensity": 3}',
    },
  ]);
  console.warn(changes);
  await effect.update({ changes });
}


if (args[0] === "on") {
  new Dialog({
    title: \`Choose the colour for Faerie Fire on \${targetActor.name}\`,
    buttons: {
      one: {
        label: "Blue",
        callback: async () => lightUp("blue"),
      },
      two: {
        label: "Green",
        callback: async () => lightUp("green"),
      },
      three: {
        label: "Purple",
        callback: async () => lightUp("purple"),
      },
    },
  }).render(true);
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));

  if (spellEffectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("glow"));
  }

  document.effects.push(effect);

  return document;
}
