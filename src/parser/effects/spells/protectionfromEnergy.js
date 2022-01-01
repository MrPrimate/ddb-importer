import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function protectionfromEnergyEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = `
//DAE  Macro, no arguments passed

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

let content = \`
<style>
    .protEnergy .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }
      
      .protEnergy .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 20%;
        line-height: normal;
      }
      
      .protEnergy .radio-label input {
        display: none;
      }
      
      .protEnergy img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }
          
      /* CHECKED STYLES */
      .protEnergy [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="protEnergy">
            <div class="form-group" id="types">
              <label class="radio-label">
                <input type="radio" name="type" value="acid">
                <img src="icons/magic/acid/dissolve-bone-white.webp" style="border:0px; width: 50px; height:50px;">
                  Acid
              </label>
              <label class="radio-label">
                <input type="radio" name="type" value="cold">
                <img src="icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" style="border:0px; width: 50px; height:50px;">
                Cold
              </label>
              <label class="radio-label">
              <input type="radio" name="type" value="fire">
              <img src="icons/magic/fire/barrier-wall-flame-ring-yellow.webp" style="border:0px; width: 50px; height:50px;">
              Fire
            </label>
            <label class="radio-label">
            <input type="radio" name="type" value="lightning">
            <img src="icons/magic/lightning/bolt-strike-blue.webp" style="border:0px; width: 50px; height:50px;">
            Lighting
          </label>
                <label class="radio-label">
                <input type="radio" name="type" value="thunder">
                <img src="icons/magic/sonic/explosion-shock-wave-teal.webp" style="border:0px; width: 50px; height:50px;">
                Thunder
              </label>
            </div>
          </form>
\`

if (args[0] === "on") {
  new Dialog({
    title: 'Choose a damage type',
    content: content,
    buttons: {
      yes: {
        icon: '<i class="fas fa-check"></i>',
        label: 'Yes',
        callback: async (html) => {
          let element = $("input[type='radio'][name='type']:checked").val();
          let resistances = tactor.data.data.traits.dr.value;
          resistances.push(element);
          await tactor.update({ "data.traits.dr.value": resistances });
          await DAE.setFlag(tactor, 'ProtectionFromEnergy', element);
          ChatMessage.create({ content: \`\${tactor.name} gains resistance to \${element}\` });
        }
      },
    },
  }).render(true, {width: 400});
}
if (args[0] === "off") {
  let element = DAE.getFlag(tactor, 'ProtectionFromEnergy');
  let resistances = tactor.data.data.traits.dr.value;
  const index = resistances.indexOf(element);
  resistances.splice(index, 1);
  await tactor.update({ "data.traits.dr.value": resistances });
  await DAE.unsetFlag(tactor, 'ProtectionFromEnergy');
  ChatMessage.create({ content: \`\${tactor.name} loses resistance to \${element}\` });
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("", 0));
  document.effects.push(effect);

  return document;
}
