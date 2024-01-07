const rageItem = actor.items.getName('Raging Storm: Tundra');
if (rageItem) {
  return MidiQOL.completeItemUse(rageItem);
}
