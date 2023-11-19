const lastArg = args[args.length - 1];
const targetActor = DDBImporter?.EffectHelper.getActor(lastArg.actorUuid);
const targetType = DDBImporter?.EffectHelper.getTypeOrRace(targetActor);
const isUndead = targetType.toLowerCase().includes("undead");

if (isUndead) {
  ChatMessage.create({ content: `${targetActor.name} is undead and has disadvantage on attack rolls against you until the start of your next turn` });
}

