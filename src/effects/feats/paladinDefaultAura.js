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
      setProperty(effect, "flags.core.statusId", "1");
      setProperty(effect, "flags.dae.stackable", "noneName");
    }
  });
  return document;
}

