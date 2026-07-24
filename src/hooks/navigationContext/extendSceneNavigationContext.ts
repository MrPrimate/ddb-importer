import { FileHelper, utils } from "../../lib/_module";
import { collectSceneData, SceneEnhancerExport } from "../../apps/SceneEnhancerExport";
import SceneGridPickerApp from "../../apps/SceneGridPickerApp";
import { resolveSceneGridImageSource } from "../../apps/SceneGridDetector";
import SceneCopyApp from "../../apps/SceneCopyApp";
import SceneLevelCopyApp from "../../apps/SceneLevelCopyApp";

function getSceneId(li: HTMLLIElement): string {
  return $(li).attr("data-entry-id")
    ?? $(li).attr("data-document-id")
    ?? $(li).attr("data-scene-id")
    ?? $(li).attr("data-entity-id")
    ?? "";
}

export default function (_html: HTMLElement | JQuery<HTMLElement>, contextOptions: Record<string, any>[]) {
  contextOptions.push({
    name: "ddb-importer.scenes.download",
    callback: (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      const ddbFlags = scene.flags.ddb;
      // the condition below only offers this entry for scenes with ddb flags
      if (!ddbFlags?.bookCode) return undefined;
      const data = collectSceneData(scene, ddbFlags.bookCode);
      const bookCode = `${ddbFlags.bookCode}-${ddbFlags.ddbId}`;
      const cobaltId = ddbFlags.cobaltId ? `-${ddbFlags.cobaltId}` : "";
      const parentId = ddbFlags.parentId ? `-${ddbFlags.parentId}` : "";
      const contentChunkId = ddbFlags.contentChunkId ? `-${ddbFlags.contentChunkId}` : "";
      const name = (scene.name as string).replace(/[^a-z0-9_-]/gi, "").toLowerCase();
      const sceneRef = `${bookCode}${cobaltId}${parentId}${contentChunkId}-${name}`;
      return FileHelper.download(JSON.stringify(data, null, 4), `${sceneRef}-scene.json`, "application/json");
    },
    condition: (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li));
      const sceneDownload = utils.getSetting<boolean>("allow-scene-download");
      const allowDownload = game.user.isGM && sceneDownload && scene?.flags?.ddb?.ddbId;
      return allowDownload;
    },
    icon: "<i class=\"fas fa-share-alt\"></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.third-party-download",
    callback: (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li))as Scene;
      if (scene) new SceneEnhancerExport(scene).render(true);
    },
    condition: (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li));
      const sceneDownload = utils.getSetting<boolean>("allow-third-party-scene-download")
        || utils.getSetting<boolean>("developer-mode");
      const allowDownload = game.user.isGM && sceneDownload && !scene?.flags?.ddb?.ddbId;
      return allowDownload;
    },
    icon: "<i class=\"fas fa-share-alt\"></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.detect-grid",
    callback: async (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      if (!scene) return;
      await SceneGridPickerApp.open(scene);
    },
    condition: (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      return Boolean(game.user.isGM && scene && resolveSceneGridImageSource(scene));
    },
    icon: "<i class=\"fas fa-border-all\"></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.copy-fields",
    callback: (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      if (scene) new SceneCopyApp(scene).render({ force: true });
    },
    condition: (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li));
      const sceneDownload = utils.getSetting<boolean>("allow-scene-download")
        || utils.getSetting<boolean>("developer-mode");
      return Boolean(game.user.isGM && sceneDownload && scene);
    },
    icon: "<i class=\"fas fa-copy\"></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.copy-level-objects",
    callback: (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      if (scene) new SceneLevelCopyApp(scene).render({ force: true });
    },
    condition: (li: HTMLLIElement) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      const sceneDownload = utils.getSetting<boolean>("allow-scene-download")
        || utils.getSetting<boolean>("developer-mode");
      const hasLevels = Array.isArray(scene?.levels?.contents)
        ? scene.levels.contents.length > 0
        : (scene?.levels?.size ?? 0) > 0;
      return Boolean(game.user.isGM && sceneDownload && scene && hasLevels);
    },
    icon: "<i class=\"fas fa-layer-group\"></i>",
  });
}
