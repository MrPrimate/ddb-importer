// import utils from "../../utils.js";
import { download } from "../../muncher/utils.js";
import { collectSceneData, SceneEnhancerExport } from "../../muncher/sceneEnhancer.js";


export default function (html, contextOptions) {
  contextOptions.push({
    name: "ddb-importer.scenes.download",
    callback: (li) => {
      const sceneId = $(li).attr("data-scene-id") ? $(li).attr("data-scene-id") : $(li).attr("data-entity-id");
      const scene = game.scenes.get(sceneId);
      // console.warn(scene);
      const data = collectSceneData(scene, scene.data.flags.ddb.bookCode);
      const bookCode = `${scene.data.flags.ddb.bookCode}-${scene.data.flags.ddb.ddbId}`;
      const cobaltId = scene.data.flags.ddb?.cobaltId ? `-${scene.data.flags.ddb.cobaltId}` : "";
      const parentId = scene.data.flags.ddb?.parentId ? `-${scene.data.flags.ddb.parentId}` : "";
      const contentChunkId = scene.data.flags.ddb?.contentChunkId ? `-${scene.data.flags.ddb.contentChunkId}` : "";
      const name = scene.data.name.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      const sceneRef = `${bookCode}${cobaltId}${parentId}${contentChunkId}-${name}`;
      // console.warn(data);
      return download(JSON.stringify(data, null, 4), `${sceneRef}-scene.json`, "application/json");
    },
    condition: (li) => {
      const sceneId = $(li).attr("data-scene-id") ? $(li).attr("data-scene-id") : $(li).attr("data-entity-id");
      const scene = game.scenes.get(sceneId);
      const sceneDownload = game.settings.get("ddb-importer", "allow-scene-download");
      const allowDownload = game.user.isGM && sceneDownload && scene.data.flags.ddb?.ddbId;
      return allowDownload;
    },
    icon: '<i class="fas fa-share-alt"></i>',
  });

  contextOptions.push({
    name: "ddb-importer.scenes.third-party-download",
    callback: (li) => {
      const sceneId = $(li).attr("data-scene-id") ? $(li).attr("data-scene-id") : $(li).attr("data-entity-id");
      const scene = game.scenes.get(sceneId);
      new SceneEnhancerExport(scene).render(true);
    },
    condition: (li) => {
      const sceneId = $(li).attr("data-scene-id") ? $(li).attr("data-scene-id") : $(li).attr("data-entity-id");
      const scene = game.scenes.get(sceneId);
      const sceneDownload = game.settings.get("ddb-importer", "allow-third-party-scene-download");
      const allowDownload = game.user.isGM && sceneDownload && !scene.data.flags.ddb?.ddbId;
      return allowDownload;
    },
    icon: '<i class="fas fa-share-alt"></i>',
  });
}
