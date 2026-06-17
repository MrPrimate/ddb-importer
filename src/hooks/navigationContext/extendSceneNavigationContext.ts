import { FileHelper } from "../../lib/_module";
import { collectSceneData, SceneEnhancerExport } from "../../apps/SceneEnhancerExport";
import SceneGridPickerApp from "../../apps/SceneGridPickerApp";
import { resolveSceneGridImageSource } from "../../apps/SceneGridDetector";
import SceneCopyApp from "../../apps/SceneCopyApp";
import SceneLevelCopyApp from "../../apps/SceneLevelCopyApp";

function getSceneId(li) {
  return $(li).attr("data-entry-id")
    ?? $(li).attr("data-document-id")
    ?? $(li).attr("data-scene-id")
    ?? $(li).attr("data-entity-id");
}

export default function (_html, contextOptions) {
  contextOptions.push({
    name: "ddb-importer.scenes.download",
    callback: (li) => {
      const scene = game.scenes.get(getSceneId(li)) as unknown as I5eSceneData;
      const data = collectSceneData(scene, scene.flags.ddb.bookCode);
      const bookCode = `${scene.flags.ddb.bookCode}-${scene.flags.ddb.ddbId}`;
      const cobaltId = scene.flags.ddb?.cobaltId ? `-${scene.flags.ddb.cobaltId}` : "";
      const parentId = scene.flags.ddb?.parentId ? `-${scene.flags.ddb.parentId}` : "";
      const contentChunkId = scene.flags.ddb?.contentChunkId ? `-${scene.flags.ddb.contentChunkId}` : "";
      const name = scene.name.replace(/[^a-z0-9_-]/gi, "").toLowerCase();
      const sceneRef = `${bookCode}${cobaltId}${parentId}${contentChunkId}-${name}`;
      return FileHelper.download(JSON.stringify(data, null, 4), `${sceneRef}-scene.json`, "application/json");
    },
    condition: (li) => {
      const scene = game.scenes.get(getSceneId(li));
      const sceneDownload = game.settings.get("ddb-importer", "allow-scene-download");
      const allowDownload = game.user.isGM && sceneDownload && scene.flags?.ddb?.ddbId;
      return allowDownload;
    },
    icon: "<i class=\"fas fa-share-alt\"></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.third-party-download",
    callback: (li) => {
      const scene = game.scenes.get(getSceneId(li))as Scene;
      if (scene) new SceneEnhancerExport(scene).render(true);
    },
    condition: (li) => {
      const scene = game.scenes.get(getSceneId(li));
      const sceneDownload = game.settings.get("ddb-importer", "allow-third-party-scene-download")
        || game.settings.get("ddb-importer", "developer-mode");
      const allowDownload = game.user.isGM && sceneDownload && !scene.flags?.ddb?.ddbId;
      return allowDownload;
    },
    icon: "<i class=\"fas fa-share-alt\"></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.detect-grid",
    callback: async (li) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      if (!scene) return;
      await SceneGridPickerApp.open(scene);
    },
    condition: (li) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      return Boolean(game.user.isGM && scene && resolveSceneGridImageSource(scene));
    },
    icon: "<i class=\"fas fa-border-all\"></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.copy-fields",
    callback: (li) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      if (scene) new SceneCopyApp(scene).render({ force: true });
    },
    condition: (li) => {
      const scene = game.scenes.get(getSceneId(li));
      const sceneDownload = game.settings.get("ddb-importer", "allow-scene-download")
        || game.settings.get("ddb-importer", "developer-mode");
      return Boolean(game.user.isGM && sceneDownload && scene);
    },
    icon: "<i class=\"fas fa-copy\"></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.copy-level-objects",
    callback: (li) => {
      const scene = game.scenes.get(getSceneId(li)) as Scene;
      if (scene) new SceneLevelCopyApp(scene).render({ force: true });
    },
    condition: (li) => {
      const scene = game.scenes.get(getSceneId(li)) as any;
      const sceneDownload = game.settings.get("ddb-importer", "allow-scene-download")
        || game.settings.get("ddb-importer", "developer-mode");
      const hasLevels = Array.isArray(scene?.levels?.contents)
        ? scene.levels.contents.length > 0
        : (scene?.levels?.size ?? 0) > 0;
      return Boolean(game.user.isGM && sceneDownload && scene && hasLevels);
    },
    icon: "<i class=\"fas fa-layer-group\"></i>",
  });
}
