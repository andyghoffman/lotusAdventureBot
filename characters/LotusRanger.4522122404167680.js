//load_file("C:/GitHub/lotusAdventureBot/characters/LotusRanger.4522122404167680.js");

function loadCharacter()
{
	//load_code("RangerLotus");
	
	let settings =
		{
			"FarmMap": "winterland",
			"FarmMonster": "arcticbee",
			"FarmSpawn": 10,
			"TetherRadius": 100
		};

	startBotCore(settings);
	beginFarming();
}

function characterCombat()
{

}