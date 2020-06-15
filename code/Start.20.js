load_code("logging");
load_code("BotComms");
load_code("StandardBot");
load_code("MerchantBot");
load_code("Crafting");
load_code("Positioning");
load_code(character.name);

map_key("1", "snippet", "xpReport()");
map_key("2", "snippet", "reloadCharacter()");
map_key("3", "snippet", "reloadCharacters()");
map_key("4", "snippet", "stopRunners()");
map_key("5", "snippet", "loadAllRunners()");
map_key("6", "snippet", "");
map_key("7", "snippet", "");
map_key("8", "snippet", "");
map_key("9", "snippet", "");
map_key("0", "snippet", "");

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