if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  if (scope.macroActivity?.type !== "attack") return;

  if (item.system.uses.value <= 3) {
    const effect = actor.effects.find((e) => e.origin === item.uuid);
    if (!effect) {
      console.error("Unable to find Crown of Stars Light effect")
      return;
    }

    if (item.system.uses.value === 0) {
      effect.delete();
      return;
    }

    const changes = [
      DDBImporter.EffectHelper.generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '30'),
      DDBImporter.lib.DDBMacros.generateMacroChange({ macroType: "spell", macroName: "crownOfStars.js" }),
    ];
    await effect.update({ changes });
  }
}

// Update Spent
if (args[0] === "off") {
  const updateData = {
    _id: item._id,
    system: { uses: { spent: item.system.uses.max } },
  };
  await actor.updateEmbeddedDocuments("Item", [updateData]);
}
