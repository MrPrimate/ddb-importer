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
  const current = foundry.utils.getProperty(poolDocument, "system.uses.value");
  const value = Number.parseInt(current) - Number.parseInt(hpToRemove);
  await poolDocument.update({ "system.uses.value": value })
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
  const targets = CONFIG.Item.documentClass._formatAttackTargets();
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
  const targets = CONFIG.Item.documentClass._formatAttackTargets();
  const names = targets.length > 0
    ? targets.length > 1
        ? `${targets.map((t) => t.name).join(", ")}, are`
        : `${targets[0].name} is`
    : "Target is";

  const copyData = foundry.utils.duplicate(item);
  delete copyData._id;
  // const macroText = `Use the following macro to remove automatically [[/ddbifunc functionName="layOnHands" functionType="feat" functionParams="{removePoison: true}"]]`
  copyData.system.description.value = `${names} no longer &Reference[poisoned].`;
  copyData.system.description.chat = `${names} no longer &Reference[poisoned].`;
  const chatItem = new CONFIG.Item.documentClass(copyData, { parent: actor });
  chatItem.prepareData();
  chatItem.prepareFinalAttributes();
  chatItem.displayCard();
}

function getPoolId(actor) {
  return actor.items.find((d) => {
    const name = foundry.utils.getProperty(d, "flags.ddbimporter.originalName") ?? d.name;
    return name === "Lay on Hands Pool";
  })?._id;
}

if (scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction")) {
  const poolId = getPoolId(actor);
  if (!poolId) {
    logger.error("Unable to find Lay on Hands Pool");
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
} else if (args && args[0].macroPass === "preItemRoll") {
  const theTarget = args[0].targets[0];
  if (!theTarget) return false;

  // does not work on undead/constructs
  let invalid = ["undead", "construct"].some(type => (theTarget?.actor.system.details.type?.value || "").toLowerCase().includes(type));
  if (invalid) {
      ui.notifications.warn("Lay on Hands can't affect undead/constructs")
      return false;
  }
  let consumeTarget = args[0].itemData.system.consume.target;
  if (!consumeTarget || consumeTarget === "") {
    ui.notifications.warn("Lay on Hands can't find your resource pool.")
      return false;
  }
  const available = getProperty(actor.system, consumeTarget);
  // Have we got any left?
  if (available <= 0) return false;

  // prompt for how much to use...
  let d = new Promise((resolve, reject) => {
    let theDialog = new Dialog({
      title: "Lay on Hands",
      content: `How many points to use? ${available} available<input id="mqlohpoints" type="number" min="0" step="1.0" max="${available}"></input>`,
      buttons: {
        heal: {
          label: "Heal",
          callback: (html) => { resolve(Math.clamped(Math.floor(Number(html.find('#mqlohpoints')[0].value)), 0, available)); }
        },
        cureDiseasePoison: {
          label: "Disease/Poison",
          callback: (html) => { resolve(-Math.clamped(Math.floor(Number(html.find('#mqlohpoints')[0].value) / 5) * 5, 0, available)); }
        },
        abort: {
          icon: '<i class="fas fa-cross"></i>',
          label: "Quit",
          callback: () => { resolve(false) }
        },
      },
      default: "heal",
    }).render(true);
  });
  const consumed = await d;
  if (!consumed) return false;
  const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
  const theItem = workflow.item;
  let updates;
  if (consumed > 0) {
    updates = {
      "system.consume.amount": Math.abs(consumed),
      "system.damage.parts": [[`${Math.max(0, consumed)}`, "healing"]],
      "system.chatFlavor": "",
      "system.consume.target": consumeTarget
    };
  } else {
    updates = {
      "system.consume.amount": Math.abs(consumed),
      "system.damage.parts": [],
      "system.chatFlavor": `<h3>Remove up to ${Math.floor(Math.abs(consumed) / 5)} poisons/diseases</h3>`,
      "system.consume.target": consumeTarget
    };
  }
  setProperty(workflow, "workflowOptions.autoConsumeResource", true);
  return theItem.update(updates);
}


