import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function shillelaghEffect(document) {
  let effectShillelaghShillelagh = baseSpellEffect(document, document.name);
  const itemMacroText = `
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

let weapons = tactor.items.filter(i => i.data.type === \`weapon\`);
let weapon_content = \`\`;

for (let weapon of weapons) {
    weapon_content += \`<option value=\${weapon.id}>\${weapon.name}</option>\`;
}
if (args[0] === "on") {
    let content = \`
<div class="form-group">
  <label>Weapons : </label>
  <select name="weapons">
    \${weapon_content}
  </select>
</div>\`;

    new Dialog({
        title: "Choose a club or quarterstaff",
        content,
        buttons:
        {
            Ok:
            {
                label: \`Ok\`,
                callback: (html) => {
                    let itemId = html.find('[name=weapons]')[0].value;
                    let weaponItem = tactor.items.get(itemId);
                    let copy_item = duplicate(weaponItem);
                    DAE.setFlag(tactor, \`shillelagh\`, {
                        id : itemId,
                        damage : copy_item.data.damage.parts[0][0]    
                    });
                    let damage = copy_item.data.damage.parts[0][0];
                    var newdamage = damage.replace(/1d(4|6)/g,"1d8");
                    copy_item.data.damage.parts[0][0] = newdamage;
                    copy_item.data.ability = "wis";
                    tactor.updateEmbeddedEntity("OwnedItem", copy_item);
                    ChatMessage.create({content: copy_item.name + " is empowered"});
                }
            },
            Cancel:
            {
                label: \`Cancel\`
            }
        }
    }).render(true);
}

if (args[0] === "off") {
    let flag = DAE.getFlag(tactor, \`shillelagh\`);
    let weaponItem = tactor.items.get(flag.id);
    let copy_item = duplicate(weaponItem);
    copy_item.data.damage.parts[0][0] = flag.damage;
    copy_item.data.ability = "";
    tactor.updateEmbeddedEntity("OwnedItem", copy_item);
    DAE.unsetFlag(tactor, \`shillelagh\`);
    ChatMessage.create({content: copy_item.name + " returns to normal"});

}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectShillelaghShillelagh.changes.push(generateMacroChange("", 0));
  document.effects.push(effectShillelaghShillelagh);

  return document;
}
