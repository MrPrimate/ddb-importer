export function paladinDefaultAuraEffect(document) {
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
  return document;
}

