// based on the midiqol macro
// console.warn(scope);

async function askForLayOnHandsType(availableHP) {
  const result = await globalThis.DDBImporter.DialogHelper.ChooserDialog.Ask(
    [
      {
        label: `Hit points to heal?<br> (${availableHP} available in pool)`,
        type: "number",
        options: {
          min: "0",
          max: `${availableHP}`,
          step: "1.0",
        }
      }
    ],
    [{
      label: "Heal",
      value: "heal",
    }, {
      label: "Cure Disease",
      value: "disease",
    }, {
      label: "Remove Poison",
      value: "poison",
    }, {
      label: "Cancel",
      value: "cancel",
    }],
    { title: "Lay on Hands Choice" }
  );
  return result;
}

async function removeHPFromResource(actor, poolDocument, hpToRemove = 5) {
  const current = foundry.utils.getProperty(poolDocument, "system.uses.spent");
  const value = Number.parseInt(current) + Number.parseInt(hpToRemove);
  await poolDocument.update({ "system.uses.spent": value })
}

async function healingMessage({actor, hpToAdd, itemId}) {
  globalThis.DDBImporter.EffectHelper.simpleDamageRollToChat({
    actor,
    flavor: "Lay on Hands Healing",
    formulas: [`${hpToAdd}`],
    damageType: "healing",
    itemId,
    fastForward: true,
 })
}

function removeDiseaseMessage(actor, item) {
  const targets = dnd5e.utils.getTargetDescriptors();
  const names = targets.length > 0
    ? targets.length > 1
       ? `${targets.map((t) => t.name).join(", ")}, are`
       : `${targets[0].name} is`
    : "Target is";

  const copyData = foundry.utils.duplicate(item);
  delete copyData._id;
  copyData.system.description.value = `${names} cured of a disease.`;
  copyData.system.description.chat = `${names} cured of a disease.`;
  const chatItem = new CONFIG.Item.documentClass(copyData, { parent: actor });
  chatItem.prepareData();
  chatItem.prepareFinalAttributes();
  chatItem.displayCard();
}

async function removePoison() {
  await DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "poisoned", actor });
}

async function removePoisonMessage(actor, item) {
  const targets = dnd5e.utils.getTargetDescriptors();
  const names = targets.length > 0
    ? targets.length > 1
        ? `${targets.map((t) => t.name).join(", ")}, are`
        : `${targets[0].name} is`
    : "Target is";

  const copyData = foundry.utils.duplicate(item);
  delete copyData._id;
  copyData.system.description.value = `${names} no longer &Reference[poisoned].`;
  copyData.system.description.chat = `${names} no longer &Reference[poisoned].`;
  const chatItem = new CONFIG.Item.documentClass(copyData, { parent: actor });
  chatItem.prepareData();
  chatItem.prepareFinalAttributes();
  chatItem.displayCard();
}

function getPoolId(actor) {
  const poolId = actor.items.find((d) => {
    const name = foundry.utils.getProperty(d, "flags.ddbimporter.originalName") ?? d.name;
    return ["Lay on Hands Pool", "Lay On Hands: Healing Pool"].includes(name);
  })?._id;
  if (poolId) return poolId;
  const featureId = actor.items.find((d) => {
    const name = foundry.utils.getProperty(d, "flags.ddbimporter.originalName") ?? d.name;
    return ["lay on hands"].includes(name.toLowerCase());
  })?._id;
  if (featureId) return featureId;
  return null;
}

if (scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction")) {
  const poolId = getPoolId(actor);
  if (!poolId) {
    console.error("Unable to find Lay on Hands Pool");
    return;
  }
  const poolDocument = actor.getEmbeddedDocument("Item", poolId);
  const hp = foundry.utils.getProperty(poolDocument, "system.uses.value");
  const result = await askForLayOnHandsType(hp);
  const type = foundry.utils.getProperty(result, "button.value");
  switch (type) {
    case "heal": {
      await removeHPFromResource(actor, poolDocument, result.results[0]);
      await healingMessage({ actor, hpToAdd: result.results[0], itemId: item._id })
      break;
    }
    case "disease": {
      await removeHPFromResource(actor, poolDocument, 5);
      removeDiseaseMessage(actor, item);
      break;
    }
    case "poison": {
      await removeHPFromResource(actor, poolDocument, 5);
      removePoisonMessage(actor, item);
      break;
    }
  }
  // return;
}
// NOTE: the old midi preItemRoll arm (system.consume.target / system.damage.parts item
// surgery) was removed 2026-08-26 - those item shapes no longer exist on dnd5e 4+.
