if (args[0].tag === "OnUse" && ["preTargeting"].includes(args[0].macroPass)) {
  args[0].workflow.item.system['target']['type'] = "self";
  args[0].workflow.item.system.range = { value: null, units: "self", long: null };
  return;
}

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const gmMacroName = "Darkness (DDB - GM)";

if (args[0] === "on") {
  Hooks.once("createMeasuredTemplate", async (template) => {
    let radius = canvas.grid.size * (template.data.distance / canvas.grid.grid.options.dimensions.distance);
    const darknessSpellParams = {
      radius,
      x: template.data.x,
      y: template.data.y,
      distance: template.data.distance,
      targetActorId: targetActor.id,
    };
    await DAE.setFlag(targetActor, "darknessSpell", darknessSpellParams);
    canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
    const gmMacro = game.macros.find((m) => m.name === gmMacroName);
    gmMacro.execute({ actor, token, args: ["on", darknessSpellParams] })


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
} else if (args[0] === "off") {
  const params = await DAE.getFlag(targetActor, "darknessSpell");
  const gmMacro = game.macros.find((m) => m.name === gmMacroName);
  gmMacro.execute({ actor, token, args: ["off", params] })
  await DAE.unsetFlag(targetActor, "darknessSpell");
}
