// pass in @spellLevel
const lastArg = args[args.length - 1];
await DDBImporter?.EffectHelper.wait(500);

const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

let buf = (parseInt(args[1]) - 1) * 5;
let curHP = target.system.attributes.hp.value;

if (args[0] === "on") {
  target.update({ "system.attributes.hp.value": curHP + buf });
}
