export function paladinDefaultAuraEffect(document) {
  if (!game.modules.get("ActiveAuras")?.active) return document;
  document.effects.forEach((effect) => {
    if (effect.name.includes(" - Constant")) {
      // const distance = document.flags.ddbimporter?.dndbeyond?.levelScale?.fixedValue ?? 10;
      effect.flags.ActiveAuras = {
        aura: "Allies",
        radius: `@scale.paladin.${document.name.toLowerCase().replaceAll(" ", "-")}`,
        isAura: true,
        inactive: false,
        hidden: false,
        displayTemp: true,
      };
      effect.statuses.push(effect.name);
      foundry.utils.setProperty(effect, "flags.dae.stackable", "noneName");
    }
  });
  return document;
}

