import { getSource } from "../source.js";
import { newFeat } from "../templates/feat.js";
import { generateTable } from "../../table.js";

// "lairDescription": "<p>Black dragons dwell in swamps on the frayed edges of civilization. A black dragon&rsquo;s lair is a dismal cave, grotto, or ruin that is at least partially flooded, providing pools where the dragon rests, and where its victims can ferment. The lair is littered with the acid-pitted bones of previous victims and the fly-ridden carcasses of fresh kills, watched over by crumbling statues. Centipedes, scorpions, and snakes infest the lair, which is filled with the stench of death and decay.</p>\r\n<h4>Lair Actions</h4>\r\n<p>On initiative count 20 (losing initiative ties), the dragon takes a lair action to cause one of the following effects; the dragon can&rsquo;t use the same effect two rounds in a row:</p>\r\n<ul>\r\n<li>Pools of water that the dragon can see within 120 feet of it surge outward in a grasping tide. Any creature on the ground within 20 feet of such a pool must succeed on a DC 15 Strength saving throw or be pulled up to 20 feet into the water and knocked prone.</li>\r\n<li>A cloud of swarming insects fills a 20-foot-radius sphere centered on a point the dragon chooses within 120 feet of it. The cloud spreads around corners and remains until the dragon dismisses it as an action, uses this lair action again, or dies. The cloud is lightly obscured. Any creature in the cloud when it appears must make on a DC 15 Constitution saving throw, taking 10 (3d6) piercing damage on a failed save, or half as much damage on a successful one. A creature that ends its turn in the cloud takes 10 (3d6) piercing damage.</li>\r\n<li>Magical darkness spreads from a point the dragon chooses within 60 feet of it, filling a 15-foot-radius sphere until the dragon dismisses it as an action, uses this lair action again, or dies. The darkness spreads around corners. A creature with darkvision can&rsquo;t see through this darkness, and nonmagical light can&rsquo;t illuminate it. If any of the effect&rsquo;s area overlaps with an area of light created by a spell of 2nd level or lower, the spell that created the light is dispelled.</li>\r\n</ul>\r\n<h4>Regional Effects</h4>\r\n<p>The region containing a legendary black dragon&rsquo;s lair is warped by the dragon&rsquo;s magic, which creates one or more of the following effects:</p>\r\n<ul>\r\n<li>The land within 6 miles of the lair takes twice as long as normal to traverse, since the plants grow thick and twisted, and the swamps are thick with reeking mud.</li>\r\n<li>Water sources within 1 mile of the lair are supernaturally fouled. Enemies of the dragon that drink such water regurgitate it within minutes.<br />Fog lightly obscures the land within 6 miles of the lair.</li>\r\n</ul>\r\n<p>If the dragon dies, vegetation remains as it has grown, but other effects fade over 1d10 days.</p>",

function addPlayerDescription(monster, action) {
  let playerDescription = `</section>\nThe ${monster.name} uses a ${action.name}!`;
  return playerDescription;
}

export function getLairActions(monster, DDB_CONFIG) {
  let resource = {
    value: false,
    initiative: null
  };

  if (!monster.hasLair && monster.lairDescription == "") {
    return {
      resource: resource,
      lairActions: [],
    };
  }

  const updateExisting = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const hideDescription = game.settings.get("ddb-importer", "munching-policy-hide-description");

  let dom = new DocumentFragment();
  $.parseHTML(monster.lairDescription).forEach((element) => {
    dom.appendChild(element);
  });

  dom.childNodes.forEach((node) => {
    if (node.textContent == "\n" || node.textContent == "\r\n") {
      dom.removeChild(node);
    }
  });

  let dynamicActions = [];

  let defaultAction = newFeat("Lair Actions");
  defaultAction.data.activation.type = "lair";
  defaultAction.data.source = getSource(monster, DDB_CONFIG);
  dynamicActions.push(defaultAction);

  dom.querySelectorAll("h4").forEach((node) => {
    const name = node.textContent.trim();
    let action = newFeat(name);
    if (node.textContent == "Lair Actions" || node.textContent == "") {
      return;
    }
    action.data.source = getSource(monster, DDB_CONFIG);
    if (action.name !== "") dynamicActions.push(action);
  });

  dom.querySelectorAll("h3").forEach((node) => {
    const name = node.textContent.trim();
    let action = newFeat(name);
    if (node.textContent == "Lair Actions" || action.name == "") {
      return;
    }
    action.data.source = getSource(monster, DDB_CONFIG);
    if (action.name !== "") dynamicActions.push(action);
  });

  let actionType = "Lair Actions";
  let action = dynamicActions.find((act) => act.name == actionType);

  if (!action) {
    action = dynamicActions[0];
  } else if (hideDescription) {
    action.data.description.value = "<section class=\"secret\">\n";
  }

  dom.childNodes.forEach((node) => {
    // const switchAction = dynamicActions.find((act) => act.name == node.textContent);
    const nodeName = node.textContent.split('.')[0].trim();
    const switchAction = dynamicActions.find((act) => nodeName === act.name);
    let startFlag = false;
    if (switchAction) {
      actionType = node.textContent;
      if (action.data.description.value !== "" && hideDescription) {
        action.data.description.value += addPlayerDescription(monster, action);
      }
      action = switchAction;
      if (action.data.description.value === "") startFlag = true;
      if ((action.data.description.value === "" || action.name === "Lair Actions") && hideDescription) {
        action.data.description.value += "<section class=\"secret\">\n";
      }
    }
    if (node.outerHTML) {
      let outerHTML = node.outerHTML;
      if (switchAction && startFlag) {
        outerHTML = outerHTML.replace(`${nodeName}.`, "");
      }
      action.data.description.value += outerHTML;
    }

    const initiativeMatch = node.textContent.match(/initiative count (\d+)/);
    if (initiativeMatch) {
      resource = {
        value: true,
        initiative: parseInt(initiativeMatch[1]),
      };
    }
  });

  if (action && action.data.description.value !== "" && hideDescription) {
    action.data.description.value += addPlayerDescription(monster, action);
  }
  if (action) action.data.description.value = generateTable(monster.name, action.data.description.value, updateExisting);

  return {
    resource: resource,
    lairActions: dynamicActions,
  };
}
