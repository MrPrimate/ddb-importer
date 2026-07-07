export {};

global {

  interface IDDBEncounterMonster {
    groupId: string;
    id: number;
    uniqueId: string | null;
    name: string | null;
    order: number;
    quantity: number;
    notes: string | null;
    index: number | null;
    currentHitPoints: number;
    temporaryHitPoints: number;
    maximumHitPoints: number;
    initiative: number | null;
  }

  interface IDDBEncounterGroup {
    id: string;
    order: number;
    name: string | null;
  }

  interface IDDBEncounterPlayer {
    id: string;
    count: number;
    level: number;
    type: string;
    hidden: boolean;
    race: string | null;
    gender: string | null;
    name: string | null;
    userName: string | null;
    isReady: boolean;
    avatarUrl: string | null;
    classByLine: string | null;
    initiative: number | null;
    currentHitPoints: number;
    temporaryHitPoints: number;
    maximumHitPoints: number;
  }

  interface IDDBEncounterCampaign {
    id: number;
    name: string;
  }

  interface IDDBEncounter {
    id: string;
    copiedFromId: string | null;
    userId: number;
    name: string;
    map: string | null;
    room: string | null;
    source: string | null;
    inProgress: boolean;
    roundNum: number;
    turnNum: number;
    notes: string | null;
    monsters: IDDBEncounterMonster[];
    groups: IDDBEncounterGroup[];
    players: IDDBEncounterPlayer[];
    manualEntries: unknown[] | null;
    difficulty: number | null;
    dateCreated: number;
    dateModified: number;
    versionNumber: number;
    status: number;
    campaign: IDDBEncounterCampaign | null;
    flavorText: string | null;
    description: string | null;
    rewards: string | null;
    compendiumLink: string | null;
  }

  interface IDDBEncountersResponse {
    success: boolean;
    message: string;
    data: IDDBEncounter[];
  }

}
