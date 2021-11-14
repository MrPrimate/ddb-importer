import { getSource } from "../source.js";
import { getActionInfo, getAction, getUses, stripHtml } from "../utils.js";
import { newFeat } from "../templates/feat.js";
import { generateTable } from "../../table.js";

// "actionsDescription": "<p><em><strong>Multiattack.</strong></em> The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.</p>\r\n<p><em><strong>Bite.</strong></em> <em>Melee Weapon Attack:</em> +15 to hit, reach 15 ft., one target. <em>Hit:</em> 19 (2d10 + 8) piercing damage plus 9 (2d8) acid damage.</p>\r\n<p><em><strong>Claw.</strong></em> <em>Melee Weapon Attack:</em> +15 to hit, reach 10 ft., one target. <em>Hit:</em> 15 (2d6 + 8) slashing damage.</p>\r\n<p><em><strong>Tail.</strong></em> <em>Melee Weapon Attack:</em> +15 to hit, reach 20 ft., one target. <em>Hit:</em> 17 (2d8 + 8) bludgeoning damage.</p>\r\n<p><em><strong>Frightful Presence.</strong></em> Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 19 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.</p>\r\n<p><em><strong>Acid Breath (Recharge 5&ndash;6).</strong></em> The dragon exhales acid in a 90-foot line that is 10 feet wide. Each creature in that line must make a DC 22 Dexterity saving throw, taking 67 (15d8) acid damage on a failed save, or half as much damage on a successful one.</p>",

function generatePlayerDescription(monster, action) {
  let playerDescription = `<section class="secret">\n${action.data.description.value}`;
  if (["rwak", "mwak"].includes(action.data.actionType)) {
    playerDescription += `\n</section>\nThe ${monster.name} attacks with its ${action.name}.`;
  } else if (["rsak", "msak"].includes(action.data.actionType)) {
    playerDescription += `\n</section>\nThe ${monster.name} casts ${action.name}.`;
  } else if (["save"].includes(action.data.actionType)) {
    playerDescription += `\n</section>\nThe ${monster.name} uses ${action.name} and a save is required.`;
  } else {
    playerDescription += `\n</section>\nThe ${monster.name} uses ${action.name}.`;
  }
  return playerDescription;
}

function buildAction(action, actionInfo, textContent, type) {
  // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
  // console.log(JSON.stringify(actionInfo, null, 4));
  // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
  // console.warn(action.name);

  if (actionInfo.activation) {
    action.data.activation.cost = actionInfo.activation;
    action.data.consume.amount = actionInfo.activation;
  } else {
    action.data.activation.cost = 1;
  }
  action.data.activation.type = getAction(textContent, type);

  action.data.recharge = actionInfo.recharge;
  action.data.save = actionInfo.save;
  // assumption - if we have parsed a save dc set action type to save
  if (action.data.save.dc) {
    action.data.actionType = "save";
  }

  action.data.damage = actionInfo.damage;
  action.data.formula = actionInfo.formula;
  action.data.properties = actionInfo.properties;
  action.data.proficient = actionInfo.proficient;
  action.data.ability = actionInfo.baseAbility;
  action.data.attackBonus = actionInfo.extraAttackBonus;

  if (actionInfo.weaponAttack) {
    action.data.weaponType = actionInfo.weaponType;
    action.data.equipped = true;
    // console.log(actionInfo.weaponAttack);
    // console.log(actionInfo.meleeAttack);
    // console.log(actionInfo.rangedAttack);
    if (actionInfo.meleeAttack) {
      action.data.actionType = "mwak";
    } else if (actionInfo.rangedAttack) {
      action.data.actionType = "rwak";
    }
  } else if (actionInfo.spellAttack) {
    if (actionInfo.meleeAttack) {
      action.data.actionType = "msak";
    } else if (actionInfo.rangedAttack) {
      action.data.actionType = "rsak";
    } else {
      action.data.actionType = "save";
    }
  } else if (actionInfo.save.dc) {
    action.data.actionType = "save";
  }

  if (actionInfo.isAttack) {
    action.type = "weapon";
  }

  action.data.range = actionInfo.range;
  action.data.target = actionInfo.target;
  action.data.duration = actionInfo.duration;
  action.data.uses = actionInfo.uses;

  if (action.name.includes("/Day")) {
    action.data.uses = getUses(action.name, true);
  }

  return action;
}

export function getActions(monster, DDB_CONFIG, type = "action") {
  const hideDescription = game.settings.get("ddb-importer", "munching-policy-hide-description");
  const updateExisting = game.settings.get("ddb-importer", "munching-policy-update-existing");
  let actions;
  let characterDescription;

  switch (type) {
    case "action":
      actions = monster.actionsDescription ?? "";
      break;
    case "reaction":
      actions = monster.reactionsDescription ?? "";
      break;
    case "bonus":
      actions = monster.bonusActionsDescription ?? "";
      break;
    case "mythic":
      actions = monster.mythicActionsDescription ?? "";
      break;
    default:
      actions = "";
  }

  if (actions == "") {
    return [[], null];
  }

  let splitActions = actions.split("<h3>Roleplaying Information</h3>");
  if (splitActions.length > 1) {
    characterDescription = `<h3>Roleplaying Information</h3>${splitActions[1]}`;
  }
  actions = splitActions[0]
    .replace(/<\/strong> <strong>/g, "")
    .replace(/<\/strong><strong>/g, "")
    .replace(/&shy;/g, "");

  let dom = new DocumentFragment();
  $.parseHTML(actions).forEach((element) => {
    dom.appendChild(element);
  });

  // console.error(`Starting ${type} processing`)
  // console.warn(dom);
  // console.log(actions);
  // console.log(dom.childNodes);

  dom.childNodes.forEach((node) => {
    if (node.textContent == "\n") {
      dom.removeChild(node);
    }
  });

  let dynamicActions = [];

  // build out skeleton actions
  dom.querySelectorAll("p").forEach((node) => {

    let pDom = new DocumentFragment();
    $.parseHTML(node.outerHTML).forEach((element) => {
      pDom.appendChild(element);
    });
    const query = pDom.querySelector("strong");
    if (!query) return;
    let name = query.textContent.trim().replace(/\./g, '');
    if (!name.includes("Spell;") && !name.includes("Mythic Trait;")) {
      name = name.split(";").pop().trim();
    }
    let action = newFeat(name);
    action.data.source = getSource(monster, DDB_CONFIG);
    action.flags.monsterMunch = {
      titleHTML: query.outerHTML,
      fullName: query.textContent,
    };
    dynamicActions.push(action);
  });

  let action = dynamicActions[0];

  // there is inconsistent formatting
  if (dynamicActions.length == 0) {
    dom.querySelectorAll("p").forEach((node) => {

      let pDom = new DocumentFragment();
      $.parseHTML(node.outerHTML).forEach((element) => {
        pDom.appendChild(element);
      });
      const query = pDom.querySelector("b");
      if (!query) return;
      let name = query.textContent.trim().replace(/\./g, '');
      if (!name.includes("Spell;") && !name.includes("Mythic Trait;")) {
        name = name.split(";").pop().trim();
      }
      let action = newFeat(name);
      action.data.source = getSource(monster, DDB_CONFIG);
      action.flags.monsterMunch = {
        titleHTML: query.outerHTML,
        fullName: query.textContent,
      };
      dynamicActions.push(action);
    });
    action = dynamicActions[0];
  }


  // there is inconsistent formatting
  if (dynamicActions.length == 0) {
    dom.querySelectorAll("p").forEach((node) => {

      let pDom = new DocumentFragment();
      $.parseHTML(node.outerHTML).forEach((element) => {
        pDom.appendChild(element);
      });
      const title = pDom.textContent.split('.')[0];
      const name = title.trim();
      let action = newFeat(name);
      action.data.source = getSource(monster, DDB_CONFIG);
      if (pDom.outerHTML) {
        action.flags.monsterMunch = {
          titleHTML: pDom.outerHTML.split('.')[0],
        };
      }
      if (action.name) dynamicActions.push(action);
    });
    action = dynamicActions[0];
  }

  // homebrew fun
  if (dynamicActions.length == 0) {
    dom.querySelectorAll("div").forEach((node) => {

      let pDom = new DocumentFragment();
      $.parseHTML(node.outerHTML).forEach((element) => {
        pDom.appendChild(element);
      });
      const title = pDom.textContent.split('.')[0];
      const name = title.trim();
      let action = newFeat(name);
      action.data.source = getSource(monster, DDB_CONFIG);
      if (pDom.outerHTML) {
        action.flags.monsterMunch = {
          titleHTML: pDom.outerHTML.split('.')[0],
        };
      }
      if (action.name) dynamicActions.push(action);
    });
    action = dynamicActions[0];
  }

  // console.error(dynamicActions);

  dom.childNodes.forEach((node) => {
    // console.log("***");
    // console.warn(action);
    // console.log("***");
    // console.log(node.textContent);
    // const switchAction = dynamicActions.find((act) => node.textContent.startsWith(act.name));
    const nodeContextSplit = node.textContent.split('.');
    // console.log(nodeContextSplit);
    const nodeName = nodeContextSplit[0].trim();
    const longNodeName = (nodeContextSplit.length > 2 && nodeContextSplit[1].trim().startsWith('('))
      ? `${nodeName} ${nodeContextSplit[1].trim()}`
      : nodeName;
    let switchAction = dynamicActions.find((act) => nodeName === act.name || longNodeName === act.name);

    if (!switchAction) {
      switchAction = dynamicActions.find((act) => node.textContent.startsWith(act.flags.monsterMunch.fullName));
    }
    // console.warn(nodeName);
    // console.warn(longNodeName);
    // console.warn(switchAction);
    let startFlag = false;
    if (switchAction) {
      action = switchAction;
      if (action.data.description.value === "") {
        startFlag = true;
      }
    }

    // console.warn(node);
    // console.warn(action);
    if (!action) return;

    if (node.outerHTML) {
      let outerHTML = node.outerHTML;
      if (switchAction && startFlag) {
        // const name = new RegExp(`^${nodeName}\.?`);
        // outerHTML = outerHTML.replace(name, "");
        if (action.flags?.monsterMunch?.fullName) {
          outerHTML = outerHTML.replace(action.flags.monsterMunch.fullName, "");
        } else {
          outerHTML = outerHTML.replace(nodeName, "");
        }
        const titleDom = new DocumentFragment();
        $.parseHTML(outerHTML).forEach((element) => {
          titleDom.appendChild(element);
        });
        if (titleDom.textContent.startsWith(".")) outerHTML = outerHTML.replace(".", "");
      }
      action.data.description.value += outerHTML;
    }
  });

  dynamicActions = dynamicActions.map((da) => {
    const actionDescription = stripHtml(da.data.description.value);
    const actionInfo = getActionInfo(monster, DDB_CONFIG, da.name, actionDescription);
    const result = buildAction(da, actionInfo, actionDescription, type);
    if (hideDescription) {
      da.data.description.value = generatePlayerDescription(monster, da);
    }
    da.data.description.value = generateTable(monster.name, da.data.description.value, updateExisting);
    return result;
  });

  // console.warn(dynamicActions);
  // console.log(JSON.stringify(dynamicActions, null, 4));

  return [dynamicActions, characterDescription];
}
