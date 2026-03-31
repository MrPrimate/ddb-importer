export {};

global {

	interface ISpellLinkUuid {
		name: string;
		uuid: string;
	}

	interface ISpellLink<TChoices = unknown> {
		type: "choice" | "grant";
		advancementId: string;
		choices: TChoices;
		uuids?: ISpellLinkUuid[];
		level: number | string;
	}

	type TSpellLinks = ISpellLink[];

}
