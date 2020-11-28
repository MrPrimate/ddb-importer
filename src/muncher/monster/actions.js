import { getSource } from "./source.js";
import { getAttackInfo, getAction } from "./utils.js";
import { FEAT_TEMPLATE } from "./templates/feat.js";

// "actionsDescription": "<p><em><strong>Multiattack.</strong></em> The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.</p>\r\n<p><em><strong>Bite.</strong></em> <em>Melee Weapon Attack:</em> +15 to hit, reach 15 ft., one target. <em>Hit:</em> 19 (2d10 + 8) piercing damage plus 9 (2d8) acid damage.</p>\r\n<p><em><strong>Claw.</strong></em> <em>Melee Weapon Attack:</em> +15 to hit, reach 10 ft., one target. <em>Hit:</em> 15 (2d6 + 8) slashing damage.</p>\r\n<p><em><strong>Tail.</strong></em> <em>Melee Weapon Attack:</em> +15 to hit, reach 20 ft., one target. <em>Hit:</em> 17 (2d8 + 8) bludgeoning damage.</p>\r\n<p><em><strong>Frightful Presence.</strong></em> Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 19 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.</p>\r\n<p><em><strong>Acid Breath (Recharge 5&ndash;6).</strong></em> The dragon exhales acid in a 90-foot line that is 10 feet wide. Each creature in that line must make a DC 22 Dexterity saving throw, taking 67 (15d8) acid damage on a failed save, or half as much damage on a successful one.</p>",

export function getActions(monster, DDB_CONFIG, type = "action") {
  if (monster.actionsDescription == "") {
    return [];
  }

  let actions = null;

  switch (type) {
    case "action":
      actions = monster.actionsDescription;
      break;
    case "reaction":
      actions = monster.reactionsDescription;
      break;
    default:
      actions = "";
  }

  let dom = new DocumentFragment();
  $.parseHTML(actions).forEach((element) => {
    dom.appendChild(element);
  });
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
    let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
    let pDom = new DocumentFragment();
    $.parseHTML(node.outerHTML).forEach((element) => {
      pDom.appendChild(element);
    });
    const query = pDom.querySelector("strong");
    if (!query) return;
    action.name = query.textContent.trim().replace(/\.$/, '').trim();
    action.data.source = getSource(monster, DDB_CONFIG);
    action.flags.monsterMunch = {};
    dynamicActions.push(action);
  });

  let action = dynamicActions[0];

  // there is inconsistent formatting
  if (dynamicActions.length == 0) {
    dom.querySelectorAll("p").forEach((node) => {
      let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
      let pDom = new DocumentFragment();
      $.parseHTML(node.outerHTML).forEach((element) => {
        pDom.appendChild(element);
      });
      const query = pDom.querySelector("b");
      if (!query) return;
      action.name = query.textContent.trim().replace(/\.$/, '').trim();
      action.data.source = getSource(monster, DDB_CONFIG);
      action.flags.monsterMunch = {};
      dynamicActions.push(action);
    });
    action = dynamicActions[0];
  }


  // there is inconsistent formatting
  if (dynamicActions.length == 0) {
    dom.querySelectorAll("p").forEach((node) => {
      let action = JSON.parse(JSON.stringify(FEAT_TEMPLATE));
      let pDom = new DocumentFragment();
      $.parseHTML(node.outerHTML).forEach((element) => {
        pDom.appendChild(element);
      });
      const title = pDom.textContent.split('.')[0];
      action.name = title.trim();
      action.data.source = getSource(monster, DDB_CONFIG);
      action.flags.monsterMunch = {};
      dynamicActions.push(action);
    });
    action = dynamicActions[0];
  }

  dom.childNodes.forEach((node) => {
  // console.log("***");
  // console.log(node.textContent);
    const switchAction = dynamicActions.find((act) => node.textContent.startsWith(act.name));
    if (switchAction) {
      action = switchAction;
    }
    action.data.description.value += node.outerHTML;

    const gtAtkInfo = getAttackInfo(monster, DDB_CONFIG, action.name, node.textContent);
    // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
    // console.log(JSON.stringify(gtAtkInfo, null, 4));
    // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

    if (gtAtkInfo.activation) {
      action.data.activation.cost = gtAtkInfo.activation;
      action.data.consume.amount = gtAtkInfo.activation;
    } else {
      action.data.activation.cost = 1;
    }
    action.data.activation.type = getAction(node.textContent, type);

    action.data.recharge = gtAtkInfo.recharge;
    action.data.save = gtAtkInfo.save;
    // assumption - if we have parsed a save dc set action type to save
    if (action.data.save.dc) {
      action.data.actionType = "save";
    }

    action.data.damage = gtAtkInfo.damage;
    action.data.properties = gtAtkInfo.properties;
    action.data.proficient = gtAtkInfo.proficient;
    action.data.ability = gtAtkInfo.baseAbility;
    action.data.attackBonus = gtAtkInfo.extraAttackBonus;

    if (gtAtkInfo.weaponAttack) {
      action.data.equipped = true;
      // console.log(gtAtkInfo.weaponAttack);
      // console.log(gtAtkInfo.meleeAttack);
      // console.log(gtAtkInfo.rangedAttack);
      if (gtAtkInfo.meleeAttack) {
        action.data.actionType = "mwak";
      } else if (gtAtkInfo.rangedAttack) {
        action.data.actionType = "rwak";
      }
    } else if (gtAtkInfo.spellAttack) {
      if (gtAtkInfo.meleeAttack) {
        action.data.actionType = "msak";
      } else if (gtAtkInfo.rangedAttack) {
        action.data.actionType = "rsak";
      } else {
        action.data.actionType = "save";
      }
    } else if (gtAtkInfo.save.dc) {
      action.data.actionType = "save";
    }

    if (gtAtkInfo.isAttack) {
      action.type = "weapon";
    }

    action.data.range = gtAtkInfo.range;

    // console.log(JSON.stringify(action.data, null, 4));
    // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")


    // console.log("###########################################")
    // console.log(node.textContent);
    // console.log("##############################");
    // const b20AtkRoll = beyond20_buildAttackRoll(action.name, node.textContent);
    // //console.log(b20AtkRoll);
    // console.log(JSON.stringify(b20AtkRoll, null, 4));
    // console.log("*******************************")
    // const parsAtk = parseAttack(node.textContent);
    // //console.log(parsAtk);
    // //console.log(parsAtk.result.damage.parts);
    // console.log(JSON.stringify(parsAtk, null, 4));
    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    // const gtAtkInfo = getAttackInfo(monster, DDB_CONFIG, action.name, node.textContent);
    // console.log(JSON.stringify(gtAtkInfo, null, 4));
    // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
    // console.log(JSON.stringify(beyond20_damage(node.textContent), null, 4));
    // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
  });

  // console.log(dynamicActions);
  // console.log(JSON.stringify(dynamicActions, null, 4));

  return dynamicActions;
}
