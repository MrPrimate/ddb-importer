await game.user.updateTokenTargets([]);
await DDBImporter.EffectHelper.wait(1000);
const secondAttack = foundry.utils.duplicate(item);
secondAttack.name = `${item.name} Second Attack`;
const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions({ targetConfirmation: 'always' });
foundry.utils.setProperty(secondAttack, "flags.midi-qol", {});
foundry.utils.setProperty(secondAttack, "flags.midiProperties.confirmTargets", "always");
const attackItem = new CONFIG.Item.documentClass(secondAttack, { parent: actor });
attackItem.prepareData();
attackItem.prepareFinalAttributes();

console.warn("ACTIONS", {
  config,
  options,
  attackItem,
})
await MidiQOL.completeItemUse(attackItem, config, options);

