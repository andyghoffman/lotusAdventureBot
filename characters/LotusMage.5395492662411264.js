//load_file("C:/GitHub/lotusAdventureBot/characters/LotusMage.5395492662411264.js");

function loadCharacter()
{
	let settings =
	{
		"FarmMap": "main",
		"FarmMonster": "scorpion",
		"FarmSpawn": 6,
		"PriorityTargets": ["phoenix"],
		"Party": ["LotusRanger", "RangerLotus", "LotusMage", "LotusMerch"],
		"TetherRadius": 100
	};

	startBotCore(settings);
	Flags["Farming"] = true;
}

function characterCombat()
{

}