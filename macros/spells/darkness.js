const functionArgs = (typeof args !== 'undefined') ? args : undefined;

if (functionArgs && args[0].tag === "OnUse" && ["preTargeting"].includes(args[0].macroPass)) {
  args[0].workflow.item.system['target']['type'] = "self";
  args[0].workflow.item.system.range = { value: null, units: "self", long: null };
  return;
}

// Foundry 14 stores templates as Regions, so createMeasuredTemplate never fires. TemplatePlacement
// returns the placed shape without creating a region, which is all the light needs.
async function placeTemplate({ origin, targetActor } = {}) {
  const distance = 15;
  const placements = await dnd5e.canvas.TemplatePlacement.place({
    color: game.user.color,
    shapes: [{ type: "circle", size: distance }],
  });
  const placement = placements?.[0];
  if (!placement) return;

  const darknessSpellParams = {
    radius: placement.radius,
    x: Math.round(placement.x),
    y: Math.round(placement.y),
    distance,
    targetActorId: targetActor.id,
  };
  await targetActor.update({
    "flags.world.darknessSpell": {
      active: true,
      params: darknessSpellParams,
    },
  });
  await DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "darkness", { origin: origin.uuid }, { args: ["on", darknessSpellParams] });
}

const isSimpleDDBMacro = scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction");

console.debug("MACRO CALL", {
  scope,
  isSimpleDDBMacro,
  actor: actor,
  token: token,
  item: item,
});

if (isSimpleDDBMacro) {
  if (!actor || !item) {
    console.warn("no actor or item selected", actor, item);
    return;
  }
}

const lastArg = isSimpleDDBMacro
  ? {}
  : args[args.length - 1];
const tokenOrActor = isSimpleDDBMacro
  ? token ?? actor
  : await fromUuid(lastArg.actorUuid);
const targetActor = isSimpleDDBMacro
  ? actor
  : tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const origin = isSimpleDDBMacro
  ? item
  : await lastArg.origin;

const flagData = foundry.utils.getProperty(actor, "flags.world.darknessSpell");

const isOn = isSimpleDDBMacro
  ? (!flagData?.active ?? true)
  : args[0] === "on";

const isOff = isSimpleDDBMacro
  ? (flagData?.active ?? false)
  : args[0] === "off";

if (isOn) {
  await placeTemplate({ origin, targetActor, targetToken: tokenOrActor });
} else if (isOff) {
  DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "darkness", { actor: actor?._id, token: token?._id }, { args: ["off", flagData.params] });
  await targetActor.update({
    "flags.world.darknessSpell": {
      active: false,
      params: null,
    },
  });
}
