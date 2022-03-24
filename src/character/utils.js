export async function disableDynamicUpdates(actor) {
  actor.flags.ddbimporter.activeUpdate = false;
  const activeUpdateData = { flags: { ddbimporter: { activeUpdate: false } } };
  await actor.update(activeUpdateData);
}

export async function enableDynamicUpdates(actor) {
  actor.flags.ddbimporter.activeUpdate = true;
  const activeUpdateData = { flags: { ddbimporter: { activeUpdate: true } } };
  await actor.update(activeUpdateData);
}

export async function updateDynamicUpdates(actor, state) {
  actor.flags.ddbimporter.activeUpdate = state;
  const activeUpdateData = { flags: { ddbimporter: { activeUpdate: state } } };
  await actor.update(activeUpdateData);
}

export function getCurrentDynamicUpdateState(actor) {
  const activeUpdateState = actor.flags?.ddbimporter?.activeUpdate
    ? actor.flags.ddbimporter.activeUpdate
    : false;
  return activeUpdateState;
}

export async function setActiveSyncSpellsFlag(actor, state) {
  actor.flags.ddbimporter.activeSyncSpells = state;
  const activeUpdateData = { flags: { ddbimporter: { activeSyncSpells: state } } };
  await actor.update(activeUpdateData);
}
