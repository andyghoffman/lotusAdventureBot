load_code("logging");
load_code("events");
load_code("BotComms");
load_code("StandardBot");
load_code("MerchantBot");
load_code(character.name);

map_key("1", "snippet", "initParty()");
map_key("2", "snippet", "townParty()");
map_key("3", "snippet", "reloadCharacters()");
map_key("4", "snippet", "transferAllToMerchant()");
map_key("5", "snippet", "togglePartyAuto()");
map_key("6", "snippet", "stopCharacters()");
map_key("7", "snippet", "depositInventoryAtBank()");
map_key("8", "snippet", "xpReport()");

initBotComms();
loadCharacter();

function load_file(fileName)
{
	const fs = require('fs')
	let data = fs.readFileSync(fileName, 'utf8')
	let library = document.createElement("script");
	library.type = "text/javascript";
	library.text = data;
	document.getElementsByTagName("head")[0].appendChild(library);
}