//load_file("C:/GitHub/lotusAdventureBot/characters/LotusRanger.4522122404167680.js");

function loadCharacter()
{
	let settings =
	{
		"FarmMap": "cave",
		"FarmMonster": "bat",
		"FarmSpawn": 6,
		"PriorityTargets": ["phoenix","goldenbat"],
		"Avoid": ["bigbird"],
		"Party":["LotusRanger","RangerLotus","LotusMage","LotusMerch"],
		"TetherRadius": 100
	};

	startBotCore(settings);
	load_code("RangerLotus");
	Flags["Farming"] = true;
}

function characterCombat()
{

}