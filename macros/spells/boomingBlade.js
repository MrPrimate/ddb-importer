const lastArg = args[args.length - 1];

// macro vars
const sequencerFile = "jb2a.static_electricity.01.blue";
const sequencerScale = 1.5;
const damageType = "thunder";

// sequencer caller for effects on target
function sequencerEffect(target, file, scale) {
  if (game.modules.get("sequencer")?.active && foundry.utils.hasProperty(Sequencer.Database.entries, "jb2a")) {
    new Sequence().effect().file(file).atLocation(target).scaleToObject(scale).play();
  }
}

function weaponAttack(caster, sourceItemData, origin, target) {
  const chosenWeapon = DAE.getFlag(caster, "boomingBladeChoice");
  const filteredWeapons = caster.items.filter((i) => i.type === "weapon" && i.system.equipped);
  const weaponContent = filteredWeapons
    .map((w) => {
      const selected = chosenWeapon && chosenWeapon == w.id ? " selected" : "";
      return `<option value="${w.id}"${selected}>${w.name}</option>`;
    })
    .join("");

  const content = `
<div class="form-group">
 <label>Weapons : </label>
 <select name="weapons"}>
 ${weaponContent}
 </select>
</div>
`;
  new Dialog({
    title: "Booming Blade: Choose a weapon to attack with",
    content,
    buttons: {
      Ok: {
        label: "Ok",
        callback: async (html) => {
          const characterLevel = caster.type === "character" ? caster.system.details.level : caster.system.details.cr;
          const cantripDice = 1 + Math.floor((characterLevel + 1) / 6);
          const itemId = html.find("[name=weapons]")[0].value;
          const weaponItem = caster.getEmbeddedDocument("Item", itemId);
          DAE.setFlag(caster, "boomingBladeChoice", itemId);
          const weaponCopy = foundry.utils.duplicate(weaponItem);
          delete weaponCopy._id;
          if (cantripDice > 0) {
            weaponCopy.system.damage.parts[0][0] += ` + ${cantripDice - 1}d8[${damageType}]`;
          }
          weaponCopy.name = weaponItem.name + " [Booming Blade]";
          weaponCopy.effects.push({
            changes: [DDBImporter.lib.DDBMacros.generateMacroChange({ macroType: "spell", macroName: "boomingBlade.js", document: { name: weaponCopy.name } })],
            disabled: false,
            duration: { rounds: 1 },
            img: sourceItemData.img,
            label: sourceItemData.name,
            origin,
            transfer: false,
            flags: { targetUuid: target.uuid, casterUuid: caster.uuid, origin, cantripDice, damageType, dae: { specialDuration: ["turnStartSource", "isMoved"], transfer: false } },
          });
          if (foundry.utils.hasProperty(sourceItemData, "flags.itemacro")) foundry.utils.setProperty(weaponCopy, "flags.itemacro", foundry.utils.duplicate(sourceItemData.flags.itemacro));
          if (foundry.utils.hasProperty(sourceItemData, "flags.dae.macro")) foundry.utils.setProperty(weaponCopy, "flags.dae.macro", foundry.utils.duplicate(sourceItemData.flags.dae.macro));
          foundry.utils.setProperty(weaponCopy, "flags.midi-qol.effectActivation", false);
          const attackItem = new CONFIG.Item.documentClass(weaponCopy, { parent: caster });
          attackItem.prepareData();
          attackItem.prepareFinalAttributes();
          // console.warn(attackItem);
          const workflowOptions = {
            // autoFastForward: "on",
            autoRollAttack: true,
            // autoRollDamage: 'onHit',
            // autoFastDamage: true
          };
          const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions({ targets: [target.uuid] });
          await MidiQOL.completeItemUse(attackItem, config, options);
        },
      },
      Cancel: {
        label: "Cancel",
      },
    },
  }).render(true);
}

if (args[0].tag === "OnUse") {
  if (lastArg.targets.length > 0) {
    const casterData = await fromUuid(lastArg.actorUuid);
    const caster = casterData.actor ? casterData.actor : casterData;
    weaponAttack(caster, lastArg.itemData, lastArg.uuid, lastArg.targets[0]);
  } else {
    ui.notifications.error("Booming Blade: No target selected: please select a target and try again.");
  }

} else if (args[0] === "on") {
  const targetToken = canvas.tokens.get(lastArg.tokenId);
  sequencerEffect(targetToken, sequencerFile, sequencerScale);
} else if (args[0] === "off") {
  // uses midis move flag to determine if to apply extra damage
  if (lastArg["expiry-reason"] === "midi-qol:isMoved" || lastArg["expiry-reaason"] === "midi-qol:isMoved") {
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const caster = await fromUuid(lastArg.efData.flags.casterUuid);
    const itemId = DAE.getFlag(caster, "boomingBladeChoice");
    // const sourceItem = await fromUuid(lastArg.efData.flags.origin);
    const sourceItem = caster.getEmbeddedDocument("Item", itemId);
    // const caster = sourceItem.parent;
    const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
    const damageRoll = await new CONFIG.Dice.DamageRoll(`${lastArg.efData.flags.cantripDice}d8[${damageType}]`).evaluate({ async: true });
    await MidiQOL.displayDSNForRoll(damageRoll, "damageRoll");
    const workflowItemData = foundry.utils.duplicate(sourceItem);
    workflowItemData.system.target = { value: 1, units: "", type: "creature" };
    workflowItemData.name = "Booming Blade: Movement Damage";
    workflowItemData.system.description.value = "";

    await new MidiQOL.DamageOnlyWorkflow(
      caster,
      casterToken,
      damageRoll.total,
      damageType,
      [targetToken.object], // bug in midi/levels auto cover can't cope with token
      damageRoll,
      {
        flavor: `(${CONFIG.DND5E.damageTypes[damageType].label})`,
        itemCardId: "new",
        itemData: workflowItemData,
        isCritical: false,
      }
    );
    sequencerEffect(targetToken, sequencerFile, sequencerScale);
  }
}
