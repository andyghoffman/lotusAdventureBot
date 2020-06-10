function load_file(fileName)
{
    const fs = require('fs')
    const data = fs.readFileSync(fileName, 'utf8')
    return data;
}

var library = document.createElement("script");
library.type = "text/javascript";
library.text = load_file("C:/GitHub/lotusAdventureBot/code/behaviours/StandardBotBehaviour.js");
document.getElementsByTagName("head")[0].appendChild(library);