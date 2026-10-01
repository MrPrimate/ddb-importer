import { logger, isGridDetectionEnabled } from "../../lib/_module";
import {
  runDetectionForScene,
  applyChoiceToScene,
  fetchBackgroundBlob,
  readBitmapDimensions,
} from "../../apps/SceneGridDetector";
import { isGridDetectionCandidate } from "./GridDetectionCandidate";

/**
 * A scene whose width/height matches the natural image dimensions and whose shiftX/shiftY are
 * both zero almost certainly shipped without grid alignment.
 */
async function findGridDetectionCandidates(scenes: Scene[]): Promise<Scene[]> {
  if (scenes.length === 0) return [];

  const getDimensions = async (src: string) => {
    const blob = await fetchBackgroundBlob(src);
    return readBitmapDimensions(blob);
  };

  const results = await Promise.all(scenes.map(async (scene) => {
    const ok = await isGridDetectionCandidate(scene, getDimensions);
    return ok ? scene : null;
  }));
  return results.filter((s) => s !== null);
}

/**
 * After an adventure import, offer to run grid auto-detection on the imported scenes that look
 * unaligned, and apply the recommended grid to the ones the GM ticks. Shared by the zip
 * (AdventureMunch) and native (NativeAdventureMunch) importers; does nothing when grid detection
 * is switched off.
 * @param {Scene[]} scenes the world scenes the import created or updated
 */
export async function promptGridDetectionForScenes(scenes: Scene[]): Promise<void> {
  if (!isGridDetectionEnabled()) return;

  const candidates = await findGridDetectionCandidates(scenes);
  if (candidates.length === 0) return;

  const rows = candidates
    .map((scene, i) => {
      const name = ((scene.name ?? `Scene ${i + 1}`) as string)
        .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]!);
      return `<li><label><input type="checkbox" name="scene" value="${i}" checked> ${name}</label></li>`;
    })
    .join("");

  const content = `
    <p>${candidates.length} imported scene${candidates.length === 1 ? "" : "s"} ${candidates.length === 1 ? "has" : "have"} no shift/offset and image dimensions matching the scene size.</p>
    <p>Run grid auto-detection on the selected scenes?</p>
    <ul style="list-style:none;padding-left:0;max-height:300px;overflow-y:auto;">${rows}</ul>
  `;

  const selected = await foundry.applications.api.DialogV2.wait({
    rejectClose: false,
    window: { title: "Detect Grid on Imported Scenes" },
    content,
    position: { width: 480 },
    buttons: [
      {
        action: "run",
        label: "Run Detection",
        icon: "fas fa-magnifying-glass",
        default: true,
        callback: (_event, button) => {
          const form = (button as HTMLButtonElement).form;
          if (!form) return [];
          const checked = Array.from(form.querySelectorAll<HTMLInputElement>("input[name='scene']:checked"));
          return checked.map((el) => Number(el.value));
        },
      },
      {
        action: "skip",
        label: "Skip",
        icon: "fas fa-times",
        callback: () => null,
      },
    ],
  });

  if (!Array.isArray(selected) || selected.length === 0) return;

  for (const index of selected) {
    const scene = candidates[index];
    if (!scene) continue;
    try {
      ui.notifications?.info(`Detecting grid for "${scene.name}"...`);
      const run = await runDetectionForScene(scene);
      const choice = run.recommendedKey
        ? run.candidateList.find((c) => c.key === run.recommendedKey) ?? null
        : null;
      await applyChoiceToScene(scene, run, choice);
      const sizePx = choice ? choice.entry.gridSize : Math.round(run.grid.size);
      ui.notifications?.info(`Grid updated on "${scene.name}" (size ${sizePx}px).`);
    } catch (err) {
      const msg = (err as Error).message;
      logger.error(`Grid detection failed for "${scene?.name ?? "?"}": ${msg}`, err);
      ui.notifications?.warn(`Grid detection failed for "${scene?.name ?? "?"}": ${msg}`);
    }
  }
}
