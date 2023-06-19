export function paladinDefaultAuraEffect(document) {
  document.effects.forEach((effect) => {
    if ((effect.name ?? effect.label).includes("Constant Effects")) {
      const distance = document.flags.ddbimporter?.dndbeyond?.levelScale?.fixedValue ?? 10;
      effect.flags.ActiveAuras = {
        aura: "Allies",
        radius: distance,
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

