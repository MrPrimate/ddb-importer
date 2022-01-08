import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function regenerateEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.flags.dae.macroRepeat = "startEveryTurn";
  // MACRO START
  const itemMacroText = `
//DAE Macro , no arguments
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

/**
 * Set hooks to fire on combat update and world time update
 */
if (args[0] === "on") {

    // If 6s elapses, update HP by one
    const timeHookId = Hooks.on("updateWorldTime", (currentTime, updateInterval) => {
        let effect = tactor.effects.find(i => i.data.label === "Regenerate");
        let applyTime = effect.data.duration.startTime;
        let expireTime = applyTime + effect.data.duration.seconds;
        let healing = roundCount(currentTime, updateInterval, applyTime, expireTime);
        tactor.applyDamage(-healing);
        ChatMessage.create({ content: \`\${tactor.name} gains 1 hp\` });
    }
    );

    tactor.setFlag("world", "Regenerate", {
        timeHook: timeHookId
    }
    );
}

if (args[0] === "off") {
    async function RegenerateOff() {
        let flag = await tactor.getFlag('world', 'Regenerate');
        Hooks.off("updateWorldTime", flag.timeHook);
        tactor.unsetFlag("world", "Regenerate");
        console.log("Regenerate removed");
    };
    RegenerateOff();
}


/**
 *
 * @param {Number} currentTime current world time
 * @param {Number} updateInterval amount the world time was incremented
 * @param {Number} applyTime time the effect was applied
 * @param {Number} expireTime time the effect should expire
 */
function roundCount(currentTime, updateInterval, applyTime, expireTime) {
    // Don't count time before applyTime
    if (currentTime - updateInterval < applyTime) {
        let offset = applyTime - (currentTime - updateInterval);
        updateInterval -= offset;
    }

    // Don't count time after expireTime
    if (currentTime > expireTime) {
        let offset = currentTime - expireTime;
        currentTime = expireTime;
        updateInterval -= offset;
    }

    let sTime = currentTime - updateInterval;
    let fRound = sTime + 6 - (sTime % 6); // Time of the first round
    let lRound = currentTime - (currentTime % 6); // Time of the last round
    let roundCount = 0;
    if (lRound >= fRound)
        roundCount = (lRound - fRound) / 6 + 1;

    return roundCount;
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
