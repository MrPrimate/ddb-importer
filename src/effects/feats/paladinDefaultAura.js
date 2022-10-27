export function paladinDefaultAuraEffect(document) {
  document.effects.forEach((effect) => {
    if (effect.label.includes("Constant Effects")) {
      const distance = document.flags.ddbimporter?.dndbeyond?.levelScale?.fixedValue ?? 10;
      effect.flags.ActiveAuras = {
        aura: "Allies",
        radius: distance,
        isAura: true,
        inactive: false,
        hidden: false,
        displayTemp: true,
      };
      setProperty(effect, "flags.core.statusId", 1);
    }
  });
  return document;
}

