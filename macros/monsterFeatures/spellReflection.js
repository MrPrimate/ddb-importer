// console.warn("args", {
//   args,
//   scope,
//   workflow,
//   options,
//   item,
// });

/**
 * Asynchronously gets a new target and updates workflow data.
 *
 * @param {Object} item - The item to get the new target for
 * @return {Token|undefined} The new target, or undefined if no new target is found
 */
async function getNewTarget(item, targetTitle = undefined) {
  const oldToken = options.token;
  return DDBImporter.EffectHelper.getNewMidiQOLWorkflowTarget(workflow, item, oldToken, targetTitle);
}

if (args[0].macroPass === "isSaveSuccess" && workflow.item.type === "spell") {
  const newToken = await getNewTarget(workflow.item, "Spell Deflection New Target");
  if (!newToken) return;

  const save = await DDBImporter.EffectHelper.rollSaveForItem(workflow.item, newToken, workflow);
  const saved = save.total >= save.options.targetValue;
  if (saved) {
    workflow.saves.add(newToken);
  } else {
    workflow.failedSaves.add(newToken);
  }

  const img = await DDBImporter.EffectHelper.getTokenImage(newToken);
  const saveStyle = midiConfigSettings.highlightSuccess ? (saved ? "color: green;" : "color: red;") : "";

  const midiConfigSettings = game.settings.get("midi-qol", "ConfigSettings");
  const coverSaveBonus = MidiQOL.computeCoverBonus(workflow.token, newToken, workflow.item);
  const coverBonusString = coverSaveBonus ? `(+${coverSaveBonus} Cover)` : "";
  const adv = midiConfigSettings.displaySaveAdvantage && workflow.advantageSaves.has(newToken)
    ? `(${game.i18n.localize("DND5E.Advantage")})${coverBonusString}`
    : `${coverBonusString}`;

  workflow.saveDisplayData.push({
    gmName: newToken.name,
    playerName: MidiQOL.getTokenPlayerName(newToken),
    img,
    isPC: newToken.actor.hasPlayerOwner,
    target: newToken,
    saveString: game.i18n.localize(saved ? "midi-qol.save-success" : "midi-qol.save-failure"),
    rollTotal: save.total,
    rollDetail: save,
    id: newToken.id,
    adv,
    saveStyle,
  });
}

if (args[0].macroPass === "isAttacked" && workflow.item.type === "spell") {
  const oldToken = options.token;

  if (workflow.attackTotal >= oldToken.actor.system.attributes.ac.value) {
    return;
  }

  await getNewTarget(workflow.item, "Spell Deflection New Target");
}
