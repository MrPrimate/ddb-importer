import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
import { getSource } from "./source.js";
import { getRecharge, getActivation, getFeatSave, getDamage } from "./utils.js"

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

  let actionResource = {
    value: 3,
    max: 3
  };

  const dom = JSDOM.fragment(monster.legendaryActionsDescription);

  dom.childNodes.forEach((node) => {
    if (node.textContent == "\n") {
      dom.removeChild(node);
    }
  });

  let dynamicActions = [];

  // Base feat
  let feat = JSON.parse(JSON.stringify(require("./templates/feat.json")));
  feat.name = "Legendary Actions";
  feat.data.source = getSource(monster, DDB_CONFIG);
  feat.data.description.value = dom.childNodes.textContent;
  feat.flags.monsterMunch = {};
  dynamicActions.push(feat);


  // build out skeleton actions
  dom.querySelectorAll("strong").forEach((node) => {
    let action = JSON.parse(JSON.stringify(require("./templates/feat.json")));
    action.name = node.textContent.trim().replace(/\.$/, '').trim();
    const actionMatch = monsterActions.find((mstAction) => action.name == mstAction.name
      || action.name == `${mstAction.name} Attack`
      || action.name == `${mstAction.name}`.split('(',1)[0].trim()
      || action.name == `${mstAction.name} Attack`.split('(',1)[0].trim());

    action.flags.monsterMunch = {};
    if (actionMatch) {
      action = JSON.parse(JSON.stringify(actionMatch));
      action.flags.monsterMunch['actionCopy'] = true;
    }
    else {
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
    const actionMatch = node.textContent.match(/can take (d+) legendary actions/);
    if (actionMatch) {
      actionResource.value = parseInt(actionMatch[1]);
      actionResource.max = parseInt(actionMatch[1]);
    }

    const switchAction = dynamicActions.find((act) => node.textContent.startsWith(act.name));
    if (switchAction) {
      action = switchAction;
    }
    // console.log(action)
    if (action.flags && action.flags.monstersMunch && action.flags.monsterMunch.actionCopy) return;
    action.data.description.value = action.data.description.value + node.outerHTML;

    const activationCost = getActivation(node.textContent);
    if (activationCost) {
      action.data.activation.cost = activationCost;
      action.data.consume.amount = activationCost;
    } else {
      action.data.activation.cost = 1;
    }

    action.data.recharge = getRecharge(node.textContent);
    action.data.save = getFeatSave(node.textContent, action.data.save);
    // assumption - if we have parsed a save dc set action type to save
    if(action.data.save.dc) {
      action.data.actionType = "save";
      //action.type = "weapon";
    }
    action.data.damage = getDamage(node.textContent);


  });

  // console.log(dynamicActions);

  return {
    actions: actionResource,
    legendaryActions: dynamicActions,
  };
}
