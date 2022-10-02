import { getSource } from "../source.js";
import { getRecharge, getActivation, getFeatSave, getDamage, getRange, getTarget, replaceRollable } from "../utils.js";
import { newFeat } from "../templates/feat.js";
import { generateTable } from "../../table.js";

function addPlayerDescription(monster, action) {
  let playerDescription = `</section>\nThe ${monster.name} performs ${action.name}!`;
  return playerDescription;
}


export function getLegendaryActions(monster, monsterActions) {
  if (monster.legendaryActionsDescription == "") {
    return {
      actions: {
        "value": 0,
        "max": 0
      },
      legendaryActions: [],
    };
  }

  const updateExisting = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const hideDescription = game.settings.get("ddb-importer", "munching-policy-hide-description");

  let actionResource = {
    value: 3,
    max: 3
  };

  let dom = new DocumentFragment();

  let fixedLegendaryActionsDescription = replaceRollable(monster.legendaryActionsDescription)
    .replace(/<\/strong> <strong>/g, "").replace(/<\/strong><strong>/g, "");
  $.parseHTML(fixedLegendaryActionsDescription).forEach((element) => {
    dom.appendChild(element);
  });

  dom.childNodes.forEach((node) => {
    if (node.textContent == "\n") {
      dom.removeChild(node);
    }
  });

  let dynamicActions = [];

  // Base feat
  let feat = newFeat("Legendary Actions");
  feat.system.source = getSource(monster);
  feat.system.description.value = "";
  if (hideDescription) feat.system.description.value += "<section class=\"secret\">\n";
  feat.system.description.value += monster.legendaryActionsDescription;
  if (hideDescription) feat.system.description.value += "</section>\n Performing a Legendary Action.\n\n";
  feat.flags.monsterMunch = {};
  feat.flags.monsterMunch['actionCopy'] = false;
  dynamicActions.push(feat);


  // build out skeleton actions
  dom.querySelectorAll("strong").forEach((node) => {
    const name = node.textContent.trim().replace(/\.$/, '').trim();
    let action = newFeat(name);

    const actionMatch = monsterActions.find((mstAction) =>
      name == mstAction.name
      || name == `${mstAction.name} Attack`
      || name == `${mstAction.name}`.split('(', 1)[0].trim()
      || name == `${mstAction.name} Attack`.split('(', 1)[0].trim()
    );

    action.flags.monsterMunch = {};
    if (actionMatch) {
      action = duplicate(actionMatch);
      action.flags.monsterMunch['actionCopy'] = true;
    } else {
      action.flags.monsterMunch['actionCopy'] = false;
    }
    action.system.activation.type = "legendary";
    action.system.source = getSource(monster);
    action.system.consume = {
      type: "attribute",
      target: "resources.legact.value",
      amount: 1
    };
    dynamicActions.push(action);
  });

  let action = dynamicActions.find((act) => act.name == "Legendary Actions");

  dom.childNodes
    .forEach((node) => {
    // check for action numbers
    // can take 3 legendary actions
      let startFlag = false;
      const actionMatch = node.textContent.match(/can take (d+) legendary actions/);
      if (actionMatch) {
        actionResource.value = parseInt(actionMatch[1]);
        actionResource.max = parseInt(actionMatch[1]);
      }

      //    const switchAction = dynamicActions.find((act) => node.textContent.startsWith(act.name));
      const nodeName = node.textContent.split('.')[0].trim();
      const switchAction = dynamicActions.find((act) => nodeName === act.name);
      if (action.name !== "Legendary Actions" || switchAction) {

        if (switchAction) {
          if (action.system.description.value !== "" && hideDescription && action.name !== "Legendary Actions") {
            action.system.description.value += addPlayerDescription(monster, action);
          }
          action.system.description.value = generateTable(action.name, action.system.description.value, updateExisting);
          action = switchAction;
          if (action.system.description.value === "") {
            startFlag = true;
            if (hideDescription) {
              action.system.description.value = "<section class=\"secret\">\n";
            }
          }
        }
        // console.log(action)
        if (action.flags && action.flags.monstersMunch && action.flags.monsterMunch.actionCopy) return;
        if (node.outerHTML) {
          let outerHTML = node.outerHTML;
          if (switchAction && startFlag) {
            outerHTML = outerHTML.replace(`${nodeName}.`, "");
          }
          action.system.description.value += outerHTML;
        }

        const activationCost = getActivation(node.textContent);
        if (activationCost) {
          action.system.activation.cost = activationCost;
          action.system.consume.amount = activationCost;
        } else {
          action.system.activation.cost = 1;
        }

        // only attempt to update these if we don't parse an action
        if (!action.flags.monsterMunch.actionCopy) {
          action.system.recharge = getRecharge(node.textContent);
          action.system.save = getFeatSave(node.textContent, action.system.save);
          // assumption - if we have parsed a save dc set action type to save
          if (action.system.save.dc) {
            action.system.actionType = "save";
          // action.type = "weapon";
          }
          action.system.range = getRange(node.textContent);
          action.system.target = getTarget(node.textContent);
          action.system.damage = getDamage(node.textContent);
        }
      }
    });

  if (action && action.system.description.value !== "" && hideDescription && action.name !== "Legendary Actions") {
    action.system.description.value += addPlayerDescription(monster, action);
  }
  if (action) action.system.description.value = generateTable(monster.name, action.system.description.value, updateExisting);


  // console.log(dynamicActions);

  return {
    actions: actionResource,
    legendaryActions: dynamicActions,
  };
}
