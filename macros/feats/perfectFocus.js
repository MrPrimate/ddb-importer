const items = actor.getEmbeddedCollection("Item");

const focusPoints = items.find(item => item.name === "Monk's Focus");

if (!focusPoints) return;
if (focusPoints.system.uses.value < 4) {
  const spent = focusPoints.system.uses.max - 4;
  const update = { "system.uses.spent": spent };
  focusPoints.update(update);
}
