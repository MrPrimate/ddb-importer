export async function disableDynamicUpdates(actor) {
  actor.data.flags.ddbimporter.activeUpdate = false;
  const activeUpdateData = { flags: { ddbimporter: { activeUpdate: false } } };
  await actor.update(activeUpdateData);
}

export async function enableDynamicUpdates(actor) {
  actor.data.flags.ddbimporter.activeUpdate = true;
  const activeUpdateData = { flags: { ddbimporter: { activeUpdate: true } } };
  await actor.update(activeUpdateData);
}

export async function updateDynamicUpdates(actor, state) {
  actor.data.flags.ddbimporter.activeUpdate = state;
  const activeUpdateData = { flags: { ddbimporter: { activeUpdate: state } } };
  await actor.update(activeUpdateData);
}

export function getCurrentDynamicUpdateState(actor) {
  const activeUpdateState = actor.data.flags?.ddbimporter?.activeUpdate
      ? actor.data.flags.ddbimporter.activeUpdate
      : false;
  return activeUpdateState;
}

export async function setActiveSyncSpellsFlag(actor, state) {
  actor.data.flags.ddbimporter.activeSyncSpells = state;
  const activeUpdateData = { flags: { ddbimporter: { activeSyncSpells: state } } };
  await actor.update(activeUpdateData);
}
