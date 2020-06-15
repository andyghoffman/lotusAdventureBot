//load_file("C:/GitHub/lotusAdventureBot/characters/LotusMage.5395492662411264.js");

function loadCharacter()
{
	let settings =
		{
			"FarmMap": "main",
			"FarmMonster": "poisio",
			"FarmSpawn": 5,
			"Party": ["LotusRanger", "RangerLotus", "LotusMage", "LotusMerch"],
			"TetherRadius": 100
		};

	startBotCore(settings);
	Flags["Farming"] = true;
}

function characterCombat()
{

}