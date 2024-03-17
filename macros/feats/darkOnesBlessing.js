const targetActor = args[0].actor;

const temp = targetActor.system.attributes.hp.temp ?? 0;
const level = foundry.utils.getProperty(args[0].rollData, "classes.warlock.levels");
const newTemp = level + targetActor.system.abilities.cha.mod;

if (newTemp > temp) {
  game.actors.get(targetActor._id).update({ "system.attributes.hp.temp": newTemp });
}
