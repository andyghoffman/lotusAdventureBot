//load_file("C:/GitHub/lotusAdventureBot/characters/LotusRanger.4522122404167680.js");

function loadCharacter()
{
	let settings =
		{
			"FarmMap": "main",
			"FarmMonster": "croc",
			"FarmSpawn": 6,
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