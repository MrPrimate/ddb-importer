// specialTraitsDescription
// handle legendary resistance here

import { getSource } from "./source.js";
import { getRecharge, getActivation, getFeatSave, getDamage, getAction } from "./utils.js";
import { FEAT_TEMPLATE } from "./templates/feat.js";

export function getSpecialTraits(monster, DDB_CONFIG) {
  if (monster.specialTraitsDescription == "") {
    return {
      resistance: {
        "value": 0,
        "max": 0
      },
      specialActions: [],
    };
  }

  let resistanceResource = {
    value: 0,
    max: 0
  };

  let dom = new DocumentFragment();
  $.parseHTML(monster.specialTraitsDescription).forEach((element) => {
    dom.appendChild(element);
  });

  dom.childNodes.forEach((node) => {
    if (node.textContent == "\n") {
      dom.removeChild(node);
    }
  });

  let dynamicActions = [];

  // build out skeleton actions
  dom.querySelectorAll("strong").forEach((node) => {
    let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
    action.name = node.textContent.trim().replace(/\.$/, '').trim();
    action.data.source = getSource(monster, DDB_CONFIG);
    dynamicActions.push(action);
  });

  if (dynamicActions.length == 0) {
    let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
    action.name = "Special Traits";
    action.data.source = getSource(monster, DDB_CONFIG);
    dynamicActions.push(action);
  }

  let action = dynamicActions[0];

  dom.childNodes.forEach((node) => {
    const switchAction = dynamicActions.find((act) => node.textContent.startsWith(act.name));
    if (switchAction) {
      action = switchAction;
    }
    action.data.description.value += node.outerHTML;

    const activationCost = getActivation(node.textContent);
    if (activationCost) {
      action.data.activation.cost = activationCost;
      action.data.consume.amount = activationCost;
    } else {
      action.data.activation.cost = 1;
    }
    action.data.activation.type = getAction(node.textContent, "");

    action.data.recharge = getRecharge(node.textContent);
    action.data.save = getFeatSave(node.textContent, action.data.save);
    // assumption - if we have parsed a save dc set action type to save
    if (action.data.save.dc) {
      action.data.actionType = "save";
    }
    action.data.damage = getDamage(node.textContent);

    // legendary resistance check
    const actionMatch = node.textContent.match(/Legendary Resistance \((\d+)\/Day\)/);
    if (actionMatch) {
      resistanceResource.value = parseInt(actionMatch[1]);
      resistanceResource.max = parseInt(actionMatch[1]);
      action.data.activation.type = "special";
      action.data.activation.const = null;
      action.data.consume = {
        type: "attribute",
        target: "resources.legres.value",
        amount: 1
      };
    }

  });

  // console.log(dynamicActions);

  return {
    resistance: resistanceResource,
    specialActions: dynamicActions,
  };
}
