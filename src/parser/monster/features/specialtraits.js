// specialTraitsDescription
// handle legendary resistance here

import { getRecharge, getActivation, getFeatSave, getDamage, getAction, getUses, getTarget, replaceRollable, getMonsterSource } from "../utils.js";
import { newFeat } from "../templates/feat.js";
import { generateTable } from "../../../muncher/table.js";

function addPlayerDescription(monster, action) {
  let playerDescription = `</section>\nThe ${monster.name} uses ${action.name}!`;
  return playerDescription;
}

export function getSpecialTraits(monster) {
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

  const updateExisting = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const hideDescription = game.settings.get("ddb-importer", "munching-policy-hide-description");

  let resistanceResource = {
    value: 0,
    max: 0
  };
  let characterDescription;

  let dom = new DocumentFragment();
  let splitActions = replaceRollable(monster.specialTraitsDescription).split("<h3>Roleplaying Information</h3>");
  if (splitActions.length > 1) {
    characterDescription = `<h3>Roleplaying Information</h3>${splitActions[1]}`;
  }

  const fixedDescription = splitActions[0]
    .replace(/<\/strong> <strong>/g, "").replace(/<\/strong><strong>/g, "")
    .replace(/&shy;/g, "")
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
  const source = getMonsterSource(monster);

  // build out skeleton actions
  dom.querySelectorAll("p").forEach((node) => {
    let pDom = new DocumentFragment();
    $.parseHTML(node.outerHTML).forEach((element) => {
      pDom.appendChild(element);
    });
    const query = pDom.querySelector("em");
    if (!query) return;
    let name = query.textContent.trim().replace(/\./g, '');
    if (!name.includes("Spell;") && !name.includes("Mythic Trait;")) {
      name = name.split(";").pop().trim();
    }
    let action = newFeat(name);
    action.name = name;
    action.system.source = source;
    action.flags.monsterMunch = {
      titleHTML: query.outerHTML,
      fullName: query.textContent,
    };
    if (action.name) dynamicActions.push(action);
  });

  if (dynamicActions.length == 0) {
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
      action.system.source = source;
      action.flags.monsterMunch = {
        titleHTML: query.outerHTML,
        fullName: query.textContent,
      };
      if (action.name) dynamicActions.push(action);
    });
  }

  if (dynamicActions.length == 0) {
    dom.querySelectorAll("em").forEach((node) => {
      const name = node.textContent.trim().replace(/\.$/, '').trim();
      let action = newFeat(name);
      action.system.source = source;
      action.flags.monsterMunch = {
        titleHTML: node.outerHTML,
        fullName: node.textContent,
      };
      if (action.name) dynamicActions.push(action);
    });
  }

  if (dynamicActions.length == 0) {
    dom.querySelectorAll("strong").forEach((node) => {
      const name = node.textContent.trim().replace(/\.$/, '').trim();
      let action = newFeat(name);
      action.system.source = source;
      action.flags.monsterMunch = {
        titleHTML: node.outerHTML,
        fullName: node.textContent,
      };
      if (action.name) dynamicActions.push(action);
    });
  }

  if (dynamicActions.length == 0) {
    let action = newFeat("Special Traits");
    action.system.source = source;
    action.flags.monsterMunch = {};
    if (action.name) dynamicActions.push(action);
  }

  let action = dynamicActions[0];

  // console.warn(dynamicActions);

  dom.childNodes.forEach((node) => {
    // console.warn(node.textContent);
    // const switchAction = dynamicActions.find((act) => node.textContent.startsWith(act.name));
    const nodeName = node.textContent.split('.')[0].trim();
    let switchAction = dynamicActions.find((act) => nodeName === act.name);
    if (action.name.includes("; Recharges after a Short or Long Rest")) action.name = action.name.replace("; Recharges after a Short or Long Rest", "");
    if (!switchAction) {
      switchAction = dynamicActions.find((act) => node.textContent.startsWith(act.flags.monsterMunch.fullName));
    }
    // console.log(switchAction);
    let startFlag = false;
    if (switchAction) {
      if (action.system.description.value !== "" && hideDescription) {
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

    if (node.outerHTML) {
      let outerHTML = node.outerHTML;
      if (switchAction && startFlag) {
        if (action.flags?.monsterMunch?.fullName) {
          outerHTML = outerHTML.replace(action.flags.monsterMunch.fullName, "");
        } else {
          outerHTML = outerHTML.replace(nodeName, "");
          // outerHTML = outerHTML.replace(`${nodeName}.`, "");
        }
      }
      const titleDom = new DocumentFragment();
      $.parseHTML(outerHTML).forEach((element) => {
        titleDom.appendChild(element);
      });
      if (titleDom.textContent.startsWith(". ")) outerHTML = outerHTML.replace(". ", "");
      action.system.description.value += outerHTML;
    }

    // If we have already parsed bits of this action, we probably don't want to
    // do it again!
    // if (!startFlag) return;

    action.system.activation.type = getAction(node.textContent, "");
    const activationCost = getActivation(node.textContent);
    if (activationCost) {
      action.system.activation.cost = activationCost;
      action.system.consume.amount = activationCost;
    } else if (action.system.activation.type !== "") {
      action.system.activation.cost = 1;
    }

    action.system.uses = getUses(node.textContent);
    action.system.recharge = getRecharge(node.textContent);
    action.system.save = getFeatSave(node.textContent, action.system.save);
    action.system.target = getTarget(node.textContent);
    // assumption - if we have parsed a save dc set action type to save
    if (action.system.save.dc) {
      action.system.actionType = "save";
    }
    action.system.damage = getDamage(node.textContent);
    // assumption - if the action type is not set but there is damage, the action type is other
    if (!action.system.actionType && action.system.damage.parts.length != 0) {
      action.system.actionType = "other";
    }

    // legendary resistance check
    const actionMatch = node.textContent.match(/Legendary Resistance \((\d+)\/Day/);
    if (actionMatch) {
      resistanceResource.value = parseInt(actionMatch[1]);
      resistanceResource.max = parseInt(actionMatch[1]);
      action.system.activation.type = "special";
      action.system.activation.const = null;
      action.system.consume = {
        type: "attribute",
        target: "resources.legres.value",
        amount: 1
      };
    }

  });

  if (action && action.system.description.value !== "" && hideDescription) {
    action.system.description.value += addPlayerDescription(monster, action);
  }
  if (action) action.system.description.value = generateTable(monster.name, action.system.description.value, updateExisting);

  // console.log(dynamicActions);

  return {
    resistance: resistanceResource,
    specialActions: dynamicActions,
    characterDescription: characterDescription,
  };
}
