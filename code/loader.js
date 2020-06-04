function load_file(fileName)
{
    const fs = require('fs')
    return fs.readFileSync(fileName, 'utf8');
}

let library = document.createElement("script");
library.type = "text/javascript";
library.text = load_file("C:/GitHub/lotusAdventureBot/code/main.js");
document.getElementsByTagName("head")[0].appendChild(library);