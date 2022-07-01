if(!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
}

if (args[0].tag === "OnUse") {
  return await AAhelpers.applyTemplate(args);
}
