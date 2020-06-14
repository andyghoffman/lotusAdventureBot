//load_file("C:/GitHub/lotusAdventureBot/characters/LotusMage.5395492662411264.js");

function loadCharacter()
{
	let settings =
		{
			"FarmMap": "main",
			"FarmMonster": "bee",
			"FarmSpawn": 5,
			"TetherRadius": 100
		};

	startBotCore(settings);
	beginFarming();
}

function characterCombat()
{

}