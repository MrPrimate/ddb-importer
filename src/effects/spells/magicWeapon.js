import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function magicWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // MACRO START
  const itemMacroText = `
//DAE Item Macro Execute, arguments = @item.level
if (!game.modules.get("advanced-macros")?.active) {ui.notifications.error("Please enable the Advanced Macros module") ;return;}

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const DAEItem = lastArg.efData.flags.dae.itemData

let weapons = tactor.items.filter(i => i.data.type === \`weapon\`);
let weapon_content = \`\`;

function value_limit(val, min, max) {
    return val < min ? min : (val > max ? max : val);
};
//Filter for weapons
for (let weapon of weapons) {
    weapon_content += \`<label class="radio-label">
    <input type="radio" name="weapon" value="\${weapon.id}">
    <img src="\${weapon.img}" style="border:0px; width: 50px; height:50px;">
    \${weapon.data.name}
  </label>\`;
}

/**
 * Select for weapon and apply bonus based on spell level
 */
if (args[0] === "on") {
    let content = \`
    <style>
    .magicWeapon .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }

      .magicWeapon .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 25%;
        line-height: normal;
      }

      .magicWeapon .radio-label input {
        display: none;
      }

      .magicWeapon img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }

      /* CHECKED STYLES */
      .magicWeapon [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="magicWeapon">
      <div class="form-group" id="weapons">
          \${weapon_content}
      </div>
    </form>
    \`;

    new Dialog({
        content,
        buttons:
        {
            Ok:
            {
                label: \`Ok\`,
                callback: (html) => {
                    let itemId = $("input[type='radio'][name='weapon']:checked").val();
                    let weaponItem = tactor.items.get(itemId);
                    let copy_item = duplicate(weaponItem);
                    let spellLevel = Math.floor(args[1] / 2);
                    let bonus = value_limit(spellLevel, 1, 3);
                    let wpDamage = copy_item.data.damage.parts[0][0];
                    let verDamage = copy_item.data.damage.versatile;
                    DAE.setFlag(tactor, \`magicWeapon\`, {
                        damage: weaponItem.data.data.attackBonus,
                        weapon: itemId,
                        weaponDmg: wpDamage,
                        verDmg: verDamage,
                        mgc : copy_item.data.properties.mgc
                    }
                    );
                    if(copy_item.data.attackBonus === "") copy_item.data.attackBonus = "0"
                    copy_item.data.attackBonus = \`\${parseInt(copy_item.data.attackBonus) + bonus}\`;
                    copy_item.data.damage.parts[0][0] = (wpDamage + " + " + bonus);
                    copy_item.data.properties.mgc = true
                    if (verDamage !== "" && verDamage !== null) copy_item.data.damage.versatile = (verDamage + " + " + bonus);
                    tactor.updateEmbeddedDocuments("Item", [copy_item]);
                }
            },
            Cancel:
            {
                label: \`Cancel\`
            }
        }
    }).render(true);
}

//Revert weapon and unset flag.
if (args[0] === "off") {
    let { damage, weapon, weaponDmg, verDmg, mgc} = DAE.getFlag(tactor, 'magicWeapon');
    let weaponItem = tactor.items.get(weapon);
    let copy_item = duplicate(weaponItem);
    copy_item.data.attackBonus = damage;
    copy_item.data.damage.parts[0][0] = weaponDmg;
    copy_item.data.properties.mgc = mgc
    if (verDmg !== "" && verDmg !== null) copy_item.data.damage.versatile = verDmg;
    tactor.updateEmbeddedDocuments("Item", [copy_item]);
    DAE.unsetFlag(tactor, \`magicWeapon\`);
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@item.level", 0));
  document.effects.push(effect);

  return document;
}
