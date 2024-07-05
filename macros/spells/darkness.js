const functionArgs = (typeof args !== 'undefined') ? args : undefined;

if (functionArgs && args[0].tag === "OnUse" && ["preTargeting"].includes(args[0].macroPass)) {
  args[0].workflow.item.system['target']['type'] = "self";
  args[0].workflow.item.system.range = { value: null, units: "self", long: null };
  return;
}

async function placeTemplate({ origin, targetActor, targetToken } = {}) {
  Hooks.once("createMeasuredTemplate", async (template) => {

    const v12 = foundry.utils.isNewerVersion(game.version, 12);
    const data = v12 ? template : template.data;
    const grid = v12 ? canvas.grid : canvas.grid.grid.options.dimensions;
    console.warn(template)
    let radius = canvas.grid.size * (data.distance / grid.distance);
    const darknessSpellParams = {
      radius,
      x: data.x,
      y: data.y,
      distance: data.distance,
      targetActorId: targetActor.id,
    };
    // await DAE.setFlag(targetActor, "darknessSpell", darknessSpellParams);
    await targetActor.update({
      "flags.world.darknessSpell": {
        active: true,
        params: darknessSpellParams,
      },
    });
    canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
    // console.warn("Darkness Spell", darknessSpellParams);
    await DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "darkness", { origin: origin, effect: origin }, { args: ["on", darknessSpellParams] });
  });

  const measureTemplateData = {
    t: "circle",
    user: game.userId,
    distance: 15,
    direction: 0,
    x: 0,
    y: 0,
    fillColor: game.user.color,
    flags: {
      spellEffects: {
        Darkness: {
          ActorId: targetActor.id,
        },
      },
    },
  };

  const doc = new CONFIG.MeasuredTemplate.documentClass(measureTemplateData, { parent: canvas.scene });
  const measureTemplate = new game.dnd5e.canvas.AbilityTemplate(doc);
  measureTemplate.actorSheet = targetActor.sheet;
  measureTemplate.drawPreview();
}

const isSimpleDDBMacro = scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction");

if (isSimpleDDBMacro) {


  if (!actor || !item) {
    console.warn("no actor or item selected", actor, item);
    return;
  }
}

console.warn("SimpleMacro", isSimpleDDBMacro);

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
  // const params = await DAE.getFlag(targetActor, "darknessSpell");
  DDBImporter.lib.DDBMacros.executeDDBMacroAsGM("gm", "darkness", { actor: actor._id, token: token._id }, { args: ["off", flagData.params] });
  await targetActor.update({
    "flags.world.darknessSpell": {
      active: false,
      params: null,
    },
  });
  // await DAE.unsetFlag(targetActor, "darknessSpell");
}
