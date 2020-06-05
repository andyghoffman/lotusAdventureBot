///     crafting settings       ///
const CraftingEnabled = true;
const MinimumGold = 5000000;    //  merchant won't go below this amount of gold in wallet
const BasicItemsToCraft = [];   //  keep buying and upgrading these
const UpgradeLevelToStop = 8;
const UpgradeLevelToUseTierTwoScroll = 6; //  override to use a mid-tier scroll at a lower level than necessary (for increased success chance)
const CompoundLevelToStop = 2;
const ItemsToUpgrade = ["wattire", "wgloves", "wbreeches", "wshoes", "wcap", "shield", "quiver", "pants", "gloves", "shoes"];
const ItemsToCompound = ["intring", "strring", "dexring", "ringsj", "intearring", "dexearring", "dexamulet", "intamulet", "orbofint", "orbofdex", "dexbelt", "intbelt", "wbook0", "strearring"];
const VendorTrash = ["ringsj", "cclaw", "hpamulet", "hpbelt", "vitring", "vitearring", "vitscroll", "cshell"];
const BuyFromPonty = ["seashell", "leather", "firestaff", "suckerpunch", "t2dexamulet", "t2intamulet", "rabbitsfoot", "ringofluck", "cape", "ecape", "angelwings", "bcape", "orbg", "hbow", "t2bow", "seashell"];
const PontyExclude = ["ringsj"];    //  any craft-items you don't want to buy from ponty
const Elixirs = ["elixirint0", "elixirint1", "elixirint2", "elixirdex0", "elixirdex1", "elixirdex2"];
const Scrolls = ["scroll0", "scroll1", "cscroll0", "cscroll1"];
const XynTypes = ["gem", "box"]; //  item types to be exchanged with Xyn
//////

///     farming settings        ///
//     farmMode:
//     name = travel to any spawn of the farmMonster, will change if there is more than 1. ideal if only one spawn location
//     coords = travel to farmMap and farmCoords
//     number = travel to the spawn # of farmMonsterSpawnNumber
//     specialMonsters are prioritized if they are present
///     
const FullAuto = true;  //  if true will automatically start farming on connect & startup. set false to have player control on startup
const FarmMode = "name";
const FarmMonsterName = "crabx";
const FarmMap = "main";
const FarmMonsterSpawnNumber = 5;
const FarmRadius = 200;
const FarmCoords = { x: 1202, y: -782 };    //  only used if farmMode is 'coords'
const SpecialMonsters = [/* "snowman", */"phoenix", "goldenbat"];  //  priority targets
const DontKite = ["phoenix", "bat", "goldenbat"];   //  any monsters to never kite
//////

///     combat behaviour settings       ///
const PullIndescritely = true;  //  if false, party members will wait for the party leader to pick a target before attacking
//////

///     party/character settings      ///
const MerchantName = "LotusMerch";
const MageName = "LotusMage";
const RangerName = "LotusRanger";
const PriestName = "LotusPriest";
const PartyLeader = PriestName;
const PartyList = [MerchantName, MageName, RangerName, PriestName];
const WhiteList = [];
const MerchantStrandMap = "main";
const MerchantStandCoords = { x: -118, y: 11 };
const HealthPotsToHave = 1000;
const ManaPotsToHave = 1000;
const LowPotionsThreshold = 100;
const MinMonsterDistance = 45;
const MaxLeaderDistance = 60;
const LowInventoryThreshold = 14;
const VeryLowInventoryThreshold = 7;
const MonsterHealthThreshold = 0.5;
const HealthPotThreshold = 0.98, ManaPotThreshold = 0.95;
const ItemsToHoldOnTo = [];
const MerchantItems = ["stand0", "scroll0", "scroll1", "cscroll0", "cscroll1", "seashell", "leather"];
const Potions = ["hpot1", "mpot1"];
//////

Potions.forEach(x => { ItemsToHoldOnTo.push(x) });
Elixirs.forEach(x => { MerchantItems.push(x) });
Elixirs.forEach(x => { BuyFromPonty.push(x) });
BasicItemsToCraft.forEach(x => { ItemsToUpgrade.push(x) });
ItemsToUpgrade.forEach(x => { BuyFromPonty.push(x) });
ItemsToCompound.forEach(x => { BuyFromPonty.push(x) });
PartyList.forEach(x => { WhiteList.push(x) });

//autoreload