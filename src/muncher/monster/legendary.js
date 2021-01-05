import { getSource } from "./source.js";
import { getRecharge, getActivation, getFeatSave, getDamage } from "./utils.js";
import { FEAT_TEMPLATE } from "./templates/feat.js";

function addPlayerDescription(monster, action) {
  let playerDescription = `</section>\nThe ${monster.name} performs ${action.name}!`;
  return playerDescription;
}


export function getLegendaryActions(monster, DDB_CONFIG, monsterActions) {
  if (monster.legendaryActionsDescription == "") {
    return {
      actions: {
        "value": 0,
        "max": 0
      },
      legendaryActions: [],
    };
  }

  const hideDescription = game.settings.get("ddb-importer", "munching-policy-hide-description");

  let actionResource = {
    value: 3,
    max: 3
  };

  let dom = new DocumentFragment();

  let fixedLegendaryActionsDescription = monster.legendaryActionsDescription.replace("</strong> <strong>(Cost", " (Cost");
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
  let feat = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
  feat.name = "Legendary Actions";
  feat.data.source = getSource(monster, DDB_CONFIG);
  feat.data.description.value = "";
  if (hideDescription) feat.data.description.value += "<section class=\"secret\">\n";
  feat.data.description.value += monster.legendaryActionsDescription;
  if (hideDescription) feat.data.description.value += "</section>\n Performing a Legendary Action.\n\n";
  feat.flags.monsterMunch = {};
  feat.flags.monsterMunch['actionCopy'] = false;
  dynamicActions.push(feat);


  // build out skeleton actions
  dom.querySelectorAll("strong").forEach((node) => {
    let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
    action.name = node.textContent.trim().replace(/\.$/, '').trim();
    const actionMatch = monsterActions.find((mstAction) => action.name == mstAction.name ||
      action.name == `${mstAction.name} Attack` ||
      action.name == `${mstAction.name}`.split('(', 1)[0].trim() ||
      action.name == `${mstAction.name} Attack`.split('(', 1)[0].trim());

    action.flags.monsterMunch = {};
    if (actionMatch) {
      action = JSON.parse(JSON.stringify(actionMatch));
      action.flags.monsterMunch['actionCopy'] = true;
    } else {
      action.flags.monsterMunch['actionCopy'] = false;
    }
    action.data.activation.type = "legendary";
    action.data.source = getSource(monster, DDB_CONFIG);
    action.data.consume = {
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
        if (action.data.description.value !== "" && hideDescription && action.name !== "Legendary Actions") {
          action.data.description.value += addPlayerDescription(monster, action);
        }
        action = switchAction;
        if (action.data.description.value === "") {
          startFlag = true;
          if (hideDescription) {
            action.data.description.value = "<section class=\"secret\">\n";
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
        action.data.description.value += outerHTML;
      }

      const activationCost = getActivation(node.textContent);
      if (activationCost) {
        action.data.activation.cost = activationCost;
        action.data.consume.amount = activationCost;
      } else {
        action.data.activation.cost = 1;
      }

      // only attempt to update these if we don't parse an action
      if (!action.flags.monsterMunch.actionCopy) {
        action.data.recharge = getRecharge(node.textContent);
        action.data.save = getFeatSave(node.textContent, action.data.save);
        // assumption - if we have parsed a save dc set action type to save
        if (action.data.save.dc) {
          action.data.actionType = "save";
          // action.type = "weapon";
        }
        action.data.damage = getDamage(node.textContent);
      }
    }
  });

  if (action && action.data.description.value !== "" && hideDescription && action.name !== "Legendary Actions") {
    action.data.description.value += addPlayerDescription(monster, action);
  }

  // console.log(dynamicActions);

  return {
    actions: actionResource,
    legendaryActions: dynamicActions,
  };
}
