import { baseSpellEffect, generateMacroChange, generateMacroFlags, spellEffectModules } from "../specialSpells.js";

export function spiritGuardiansEffect(document) {
  // we require active auras for this effect
  if (!spellEffectModules().activeAurasInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "data.attributes.movement.all",
      mode: 0,
      value: "/2",
      priority: "20",
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: 5,
      value:
        "turn=start,label=Spirit  Guardians,damageRoll=(@spellLevel)d8,damageType=radiant,saveRemove=false,saveDC=@attributes.spelldc,saveAbility=wis,saveDamage=halfdamage,killAnim=true",
      priority: "20",
    }
  );
  // MACRO START
  const itemMacroText = `
const lastArg = args[args.length -1];

// Check when applying the effect - if the token is not the caster and it IS the tokens turn they take damage
if (args[0] === "on" && args[1] !== lastArg.tokenId && lastArg.tokenId === game.combat?.current.tokenId) {
    const sourceItem = await fromUuid(lastArg.origin);
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const theActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

    const itemData = mergeObject(duplicate(sourceItem.data), {
        type: "weapon",
        effects: [],
        flags: {
            "midi-qol": {
                noProvokeReaction: true, // no reactions triggered
                onUseMacroName: null //
            },
        },
        data: {
            actionType: "save",
            save: {dc: Number.parseInt(args[3]), ability: "wis", scaling: "flat"},
            damage: { parts: [[\`\${args[2]}d8\`, "radiant"]] },
            "target.type": "self",
            components: {concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false},
            duration: {units: "inst", value: undefined},
            weaponType: "improv",
        }
    }, {overwrite: true, inlace: true, insertKeys: true, insertValues: true});
    itemData.data.target.type = "self";
    setProperty(itemData.flags, "autoanimations.killAnim", true);
    itemData.flags.autoanimations.killAnim = true;
    const item = new CONFIG.Item.documentClass(itemData, { parent: theActor });
    const options = { showFullCard: false, createWorkflow: true, versatile: false, configureDialog: false };
    await MidiQOL.completeItemRoll(item, options);
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.flags["ActiveAuras"] = {
    isAura: true,
    aura: "Enemy",
    radius: 15,
    alignment: "",
    type: "",
    ignoreSelf: true,
    height: false,
    hidden: false,
    hostile: false,
    onlyOnce: false,
  };
  effect.changes.push(generateMacroChange("@token @spellLevel @attributes.spelldc"));

  document.effects.push(effect);

  document.data.damage = { parts: [], versatile: "", value: "" };
  document.data['target']['type'] = "self";
  document.data.range = { value: null, units: "self", long: null };
  document.data.actionType = "";
  document.data.save.ability = "";

  return document;
}
