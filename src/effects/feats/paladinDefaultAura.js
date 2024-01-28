export function paladinDefaultAuraEffect(document) {
  if (!game.modules.get("ActiveAuras")?.active) return document;
  document.effects.forEach((effect) => {
    if ((effect.name ?? effect.label).includes(" - Constant")) {
      // const distance = document.flags.ddbimporter?.dndbeyond?.levelScale?.fixedValue ?? 10;
      effect.flags.ActiveAuras = {
        aura: "Allies",
        radius: `@scale.paladin.${document.name.toLowerCase().replaceAll(" ", "-")}`,
        isAura: true,
        inactive: false,
        hidden: false,
        displayTemp: true,
      };
      if (isNewerVersion(11, game.version)) {
        setProperty(effect, "flags.core.statusId", "1");
      } else {
        effect.statuses.push(effect.name);
      }
      setProperty(effect, "flags.dae.stackable", "noneName");
    }
  });
  return document;
}

