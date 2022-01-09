// pass in @spellLevel
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

let buf = (parseInt(args[1])-1) * 5;
let curHP = target.data.data.attributes.hp.value;
let curMax = target.data.data.attributes.hp.max;

if (args[0] === "on") {
  target.update({"data.attributes.hp.value": curHP+buf});
} else if (curHP > curMax) {
  target.update({"data.attributes.hp.value": curMax});
}
