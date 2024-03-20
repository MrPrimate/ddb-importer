const lastArg = args[args.length - 1];

// Check when applying the effect
if (args[0] === "on"
  && args[1] !== lastArg.tokenId // if the token is not the caster
  && lastArg.tokenId === game.combat?.current.tokenId // and it IS the tokens turn they take damage
) {
  const sourceItem = await fromUuid(lastArg.origin);
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const theActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const DAEItem = lastArg.efData.flags.dae.itemData;
  const damageType = foundry.utils.getProperty(DAEItem, "flags.ddbimporter.damageType") || "radiant";

  const itemData = foundry.utils.mergeObject(
    sourceItem.toObject(),
    {
      type: "weapon",
      effects: [],
      flags: {
        "midi-qol": {
          noProvokeReaction: true, // no reactions triggered
          onUseMacroName: null, //
        },
      },
      system: {
        equipped: true,
        actionType: "save",
        save: { dc: Number.parseInt(args[3]), ability: "wis", scaling: "flat" },
        damage: { parts: [[`${args[2]}d8`, damageType]] },
        "target.type": "self",
        properties: [],
        duration: { units: "inst", value: undefined },
        type: {
          value: "improv",
        },
      },
    },
    { overwrite: true, inlace: true, insertKeys: true, insertValues: true }
  );
  itemData.system.target.type = "self";
  foundry.utils.setProperty(itemData.flags, "autoanimations.killAnim", true);
  const item = new CONFIG.Item.documentClass(itemData, { parent: theActor });
  item.prepareData();
  item.prepareFinalAttributes();
  const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions();
  await MidiQOL.completeItemUse(item, config, options);
}
