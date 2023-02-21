const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "each") {

  const confusionRoll = await new Roll("1d10").evaluate({ async: true });
  const result = confusionRoll.total;
  let content;
  switch (result) {
    case 1:
      content = "The creature uses all its movement to move in a random direction. To determine the direction, roll a  [[d8]] and assign a direction to each die face. The creature doesn't take an action this turn.";
      break;
    case 2:
      content = "The creature doesn't move or take actions this turn.";
      break;
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      content = "The creature uses its action to make a melee attack against a randomly determined creature within its reach. If there is no creature within its reach, the creature does nothing this turn.";
      break;
    case 8:
    case 9:
    case 10:
      content = "The creature can act and move normally.";
      break;
  }
  ChatMessage.create({ content: `Confusion roll for ${targetActor.name} is ${result}:<br> ` + content });
}
