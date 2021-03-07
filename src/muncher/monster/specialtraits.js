// specialTraitsDescription
// handle legendary resistance here

import { getSource } from "./source.js";
import { getRecharge, getActivation, getFeatSave, getDamage, getAction, getUses } from "./utils.js";
import { FEAT_TEMPLATE } from "./templates/feat.js";


function addPlayerDescription(monster, action) {
  let playerDescription = `</section>\nThe ${monster.name} uses ${action.name}!`;
  return playerDescription;
}

export function getSpecialTraits(monster, DDB_CONFIG) {
  if (monster.specialTraitsDescription == "") {
    return {
      resistance: {
        "value": 0,
        "max": 0
      },
      specialActions: [],
      characterDescription: null,
    };
  }

  const hideDescription = game.settings.get("ddb-importer", "munching-policy-hide-description");

  let resistanceResource = {
    value: 0,
    max: 0
  };
  let characterDescription;

  let dom = new DocumentFragment();
  let splitActions = monster.specialTraitsDescription.split("<h3>Roleplaying Information</h3>");
  if (splitActions.length > 1) {
    characterDescription = `<h3>Roleplaying Information</h3>${splitActions[1]}`;
  }

  const fixedDescription = splitActions[0]
    .replace(/<\/strong> <strong>/g, "").replace(/<\/strong><strong>/g, "")
    .replace(/<br \/>/g, "</p><p>");
  $.parseHTML(fixedDescription).forEach((element) => {
    dom.appendChild(element);
  });

  dom.childNodes.forEach((node) => {
    if (node.textContent == "\n") {
      dom.removeChild(node);
    }
  });

  // console.error(`Starting special traits processing`)
  // console.warn(dom);
  // console.log(fixedDescription);
  // console.log(dom.childNodes);

  let dynamicActions = [];

  // build out skeleton actions
  dom.querySelectorAll("p").forEach((node) => {
    let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
    let pDom = new DocumentFragment();
    $.parseHTML(node.outerHTML).forEach((element) => {
      pDom.appendChild(element);
    });
    const query = pDom.querySelector("em");
    if (!query) return;
    action.name = query.textContent.trim().replace(/\./g, '').split(";").pop().trim();
    action.data.source = getSource(monster, DDB_CONFIG);
    action.flags.monsterMunch = {
      titleHTML: query.outerHTML,
    };
    if (action.name) dynamicActions.push(action);
  });

  if (dynamicActions.length == 0) {
    dom.querySelectorAll("p").forEach((node) => {
      let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
      let pDom = new DocumentFragment();
      $.parseHTML(node.outerHTML).forEach((element) => {
        pDom.appendChild(element);
      });
      const query = pDom.querySelector("strong");
      if (!query) return;
      action.name = query.textContent.trim().replace(/\./g, '').split(";").pop().trim();
      action.data.source = getSource(monster, DDB_CONFIG);
      action.flags.monsterMunch = {
        titleHTML: query.outerHTML,
      };
      if (action.name) dynamicActions.push(action);
    });
  }

  if (dynamicActions.length == 0) {
    dom.querySelectorAll("em").forEach((node) => {
      let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
      action.name = node.textContent.trim().replace(/\.$/, '').trim();
      action.data.source = getSource(monster, DDB_CONFIG);
      if (action.name) dynamicActions.push(action);
    });
  }

  if (dynamicActions.length == 0) {
    dom.querySelectorAll("strong").forEach((node) => {
      let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
      action.name = node.textContent.trim().replace(/\.$/, '').trim();
      action.data.source = getSource(monster, DDB_CONFIG);
      if (action.name) dynamicActions.push(action);
    });
  }

  if (dynamicActions.length == 0) {
    let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
    action.name = "Special Traits";
    action.data.source = getSource(monster, DDB_CONFIG);
    if (action.name) dynamicActions.push(action);
  }

  let action = dynamicActions[0];

  dom.childNodes.forEach((node) => {
    // const switchAction = dynamicActions.find((act) => node.textContent.startsWith(act.name));
    const nodeName = node.textContent.split('.')[0].trim();
    const switchAction = dynamicActions.find((act) => nodeName === act.name);
    let startFlag = false;
    if (switchAction) {
      if (action.data.description.value !== "" && hideDescription) {
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
    if (node.outerHTML) {
      let outerHTML = node.outerHTML;
      if (switchAction && startFlag) {
        outerHTML = outerHTML.replace(`${nodeName}.`, "");
      }
      action.data.description.value += outerHTML;
    }

    // If we have already parsed bits of this action, we probably don't want to
    // do it again!
    // if (!startFlag) return;

    const activationCost = getActivation(node.textContent);
    if (activationCost) {
      action.data.activation.cost = activationCost;
      action.data.consume.amount = activationCost;
    } else {
      action.data.activation.cost = 1;
    }
    action.data.activation.type = getAction(node.textContent, "");

    action.data.uses = getUses(node.textContent);
    action.data.recharge = getRecharge(node.textContent);
    action.data.save = getFeatSave(node.textContent, action.data.save);
    // assumption - if we have parsed a save dc set action type to save
    if (action.data.save.dc) {
      action.data.actionType = "save";
    }
    action.data.damage = getDamage(node.textContent);
    // assumption - if the action type is not set but there is damage, the action type is other
    if (!action.data.actionType && action.data.damage.parts.length != 0) {
      action.data.actionType = "other";
    }

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

  if (action && action.data.description.value !== "" && hideDescription) {
    action.data.description.value += addPlayerDescription(monster, action);
  }

  // console.log(dynamicActions);

  return {
    resistance: resistanceResource,
    specialActions: dynamicActions,
    characterDescription: characterDescription,
  };
}
