const targetActor = args[0].actor;

const temp = targetActor.data.attributes.hp.temp ?? 0;
const level = getProperty(args[0].rollData, "classes.warlock.levels");
const newTemp = level + targetActor.data.abilities.cha.mod;

if (newTemp > temp) {
  game.actors.get(targetActor._id).update({ "data.attributes.hp.temp": newTemp });
}
