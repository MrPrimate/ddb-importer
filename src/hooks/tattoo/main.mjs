

export function addTattooConsumable() {
  if (game.modules.get("dnd-tashas-cauldron")?.active) return;
  CONFIG.DND5E.consumableTypes["tattoo"] = {
    label: "Spellwrought Tattoo",
  };
}
