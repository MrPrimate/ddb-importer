import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function darknessEffect(document) {
  let effectDarknessDarkness = baseSpellEffect(document, document.name);
  const itemMacroText = `
if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")

//DAE macro, Effect arguments = @target 
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId) || token;


if (args[0] === "on") {

    let templateData = {
        t: "circle",
        user: game.user._id,
        distance: 15,
        direction: 0,
        x: 0,
        y: 0,
        fillColor: game.user.color,
        flags: {
            DAESRD: {
                Darkness: {
                    ActorId: tactor.id
                }
            }
        }
    };

    Hooks.once("createMeasuredTemplate", async (template) => {
        let radius = canvas.grid.size * (template.data.distance / canvas.grid.grid.options.dimensions.distance)
        circleWall(template.data.x, template.data.y, radius)
        await canvas.templates.deleteMany(template._id);
    });

    let doc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene })
    let template = new game.dnd5e.canvas.AbilityTemplate(doc);
    template.actorSheet = tactor.sheet;
    template.drawPreview();

    async function circleWall(cx, cy, radius) {
        let data = [];
        const step = 30;
        for (let i = step; i <= 360; i += step) {
            let theta0 = Math.toRadians(i - step);
            let theta1 = Math.toRadians(i);

            let lastX = Math.floor(radius * Math.cos(theta0) + cx);
            let lastY = Math.floor(radius * Math.sin(theta0) + cy);
            let newX = Math.floor(radius * Math.cos(theta1) + cx);
            let newY = Math.floor(radius * Math.sin(theta1) + cy);

            data.push({
                c: [lastX, lastY, newX, newY],
                move: CONST.WALL_MOVEMENT_TYPES.NONE,
                sense: CONST.WALL_SENSE_TYPES.NORMAL,
                dir: CONST.WALL_DIRECTIONS.BOTH,
                door: CONST.WALL_DOOR_TYPES.NONE,
                ds: CONST.WALL_DOOR_STATES.CLOSED,
                flags: {
                    DAESRD: {
                        Darkness: {
                            ActorId: tactor.id
                        }
                    }
                }
            });
        }
        canvas.scene.createEmbeddedDocuments("Wall", data)
    }

}

if (args[0] === "off") {
    async function removeWalls() {
        let darkWalls = canvas.walls.placeables.filter(w => w.data.flags?.DAESRD?.Darkness?.ActorId === tactor.id)
        let wallArray = darkWalls.map(function (w) {
            return w.data._id
        })
        await canvas.walls.deleteEmbeddedDocuments(wallArray)
    }
    removeWalls()
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectDarknessDarkness.changes.push(generateMacroChange(""));
  document.effects.push(effectDarknessDarkness);

  return document;
}
