if (args[0].macroPass == "isDamaged") {
  if (!workflow.damageFlavor?.toLocaleLowerCase().includes("psychic")) {
    const itemData = args[0].options.token.actor.items.getName("Poison Splash").toObject();
    const splashItem = new Item.implementation(itemData, { parent: args[0].options.actor });
    await MidiQOL.completeItemUse(splashItem);
  }
}
