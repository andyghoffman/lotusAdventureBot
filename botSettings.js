///     crafting settings       ///
const craftingEnabled = true;
const minimumGold = 5000000;    //  merchant won't go below this amount of gold in wallet
const basicItemsToCraft = ["bow","bow","bow","bow","bow"];   //  keep buying and upgrading these
const upgradeLevelToStop = 8;
const upgradeLevelToUseTierTwoScroll = 6; //  override to use a mid-tier scroll at a lower level than necessary (for increased success chance)
const compoundLevelToStop = 2;
const itemsToUpgrade = ["wattire","wgloves","wbreeches","wshoes","wcap","shield","quiver","pants","gloves","shoes"];
const itemsToCompound = ["intring","strring","dexring","ringsj","intearring","dexearring","dexamulet","intamulet","orbofint","orbofdex","dexbelt","intbelt","wbook0","strearring"];
const vendorTrash = ["cclaw","hpamulet","hpbelt","vitring","vitearring","vitscroll","cshell"];
const buyFromPontyList = ["seashell","leather","firestaff","suckerpunch","t2dexamulet","t2intamulet","rabbitsfoot","ringofluck","cape","ecape","angelwings","bcape","orbg","hbow","t2bow","seashell"];
const pontyExclude = ["ringsj"];    //  any craft-items you don't want to buy from ponty
const elixirs = ["elixirint0", "elixirint1", "elixirint2", "elixirdex0", "elixirdex1", "elixirdex2"];
const scrolls = ["scroll0","scroll1","cscroll0","cscroll1"];
const xynTypes = ["gem","box"]; //  item types to be exchanged with Xyn
//////

///     farming settings        ///
///     farmMode:
///     name = travel to any spawn of the farmMonster, will change if there is more than 1. ideal if only one spawn location
///     coords = travel to farmMap and farmCoords
///     number = travel to the spawn # of farmMonsterSpawnNumber
///
///     specialMonsters are prioritized if they are present
const fullAuto = true;  //  if true will automatically start farming on connect & startup. set false to have player control on startup
const farmMode = "name";
const farmMonsterName = "boar";
const farmMap = "winterland";
const farmMonsterSpawnNumber = 8;
const farmRadius = 400;
const farmCoords = {x:1202, y:-782};    //  only used if farmMode is 'coords'
const specialMonsters = ["snowman","phoenix","goldenbat"];  //  priority targets
const dontKite = ["phoenix","bat","goldenbat"];   //  any monsters to not try to kite
//////

///     party/character settings      ///
const merchantName = "LotusMerch";
const mageName = "LotusMage";
const rangerName = "LotusRanger";
const priestName = "LotusPriest";
const partyLeader = priestName;
const partyList = [merchantName, mageName, rangerName, priestName];
const whiteList = [];
const merchantStandMap = "main";
const merchantStandCoords = {x:-118, y:11};
const healthPotionsToHave = 1000;
const manaPotionsToHave = 1000;
const lowPotionsThreshold = 100;
const minimumMonsterDistance = 45;
const maxLeaderDistance = 60;
const lowInventoryThreshold = 14;
const veryLowInventoryThreshold = 7;
const monsterHpThresholdForSkills = 0.5;
const healthPotThreshold = 0.98, manaPotThreshold = 0.95;
const itemsToHoldOnTo = [];
const merchantItems = ["stand0","scroll0","scroll1","cscroll0","cscroll1","seashell","leather"];
const potions = ["hpot1","mpot1"];
//////

potions.forEach(x=>{itemsToHoldOnTo.push(x)});
elixirs.forEach(x=>{merchantItems.push(x)});
elixirs.forEach(x=>{buyFromPontyList.push(x)});
basicItemsToCraft.forEach(x=>{itemsToUpgrade.push(x)});
itemsToUpgrade.forEach(x=>{buyFromPontyList.push(x)});
itemsToCompound.forEach(x=>{buyFromPontyList.push(x)});
partyList.forEach(x=>{whiteList.push(x)});

//autoreload