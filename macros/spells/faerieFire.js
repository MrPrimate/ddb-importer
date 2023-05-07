const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function lightUp(colour) {
  const colours = {
    blue: "#5ab9e2",
    purple: "#844ec6",
    green: "#55d553",
  };

  const effect = targetActor.effects.find((e) => (e.name ?? e.label) === (lastArg.efData.name ?? lastArg.efData.label));
  const changes = effect.changes.concat([
    {
      key: "ATL.light.color",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 30,
      value: `${colours[colour]}`,
    },
    {
      key: "ATL.light.alpha",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 30,
      value: "0.65",
    },
    {
      key: "ATL.light.dim",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 30,
      value: "10",
    },
    {
      key: "ATL.light.animation",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority: 30,
      value: '{"type": "pulse","speed": 1,"intensity": 3}',
    },
  ]);
  await effect.update({ changes });
}


if (args[0] === "on") {
  new Dialog({
    title: `Choose the colour for Faerie Fire on ${targetActor.name}`,
    buttons: {
      one: {
        label: "Blue",
        callback: async () => lightUp("blue"),
      },
      two: {
        label: "Green",
        callback: async () => lightUp("green"),
      },
      three: {
        label: "Purple",
        callback: async () => lightUp("purple"),
      },
    },
  }).render(true);
}

