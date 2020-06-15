///     crafting settings       ///
const CraftingEnabled = true;
const MinimumGold = 20000000;    //  merchant won't go below this amount of gold in wallet
const BasicItemsToCraft = [];   //  keep buying and upgrading these
const UpgradeLevelToStop = 8;
const UpgradeLevelToUseTierTwoScroll = 6; //  override to use a mid-tier scroll at a lower level than necessary (for increased success chance)
const CompoundLevelToStop = 2;
const CompoundLevelToUseTierTwoScroll = 1;
const ItemsToUpgrade = ["mushroomstaff","firestaff","bow","hbow","wattire", "wgloves", "wbreeches", "wshoes", "wcap", "shield", "quiver", "pants", "gloves", "shoes","helmet"];
const ItemsToCompound = ["intring", "strring", "dexring", "ringsj", "intearring", "dexearring", "stramulet", "dexamulet", "intamulet", "orbofint", "orbofdex", "dexbelt", "intbelt", "wbook0", "strearring"];
const VendorTrash = ["beewings","slimestaff","sstinger","ringsj", "cclaw", "hpamulet", "hpbelt", "vitring", "vitearring", "vitscroll", "cshell"];
const BuyFromPonty = ["mushroomstaff","ascale","cscale","pleather","bfur","seashell", "leather", "firestaff", "suckerpunch", "t2dexamulet", "t2intamulet", "rabbitsfoot", "ringofluck", "cape", "ecape", "angelwings", "bcape", "orbg", "hbow", "t2bow", "seashell"];
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
const FarmMode = "number";
const FarmMonsterName = "arcticbee";
const FarmMap = "winterland";
const FarmMonsterSpawnNumber = 10;
const FarmRadius = 150;
const FarmCoords = { x: 1202, y: -782 };    //  only used if farmMode is 'coords'
const SpecialMonsters = ["snowman", "phoenix", "goldenbat"];
//  solo character settings (only used if solo character is set up)
const SoloCharacterActive = false;
const SoloCharFarmMode = "number";
const SoloCharFarmMonsterName = "crab";
const SoloCharFarmMap = "main";
const SoloCharFarmMonsterSpawnNumber = 8;
const SoloFarmRadius = 100;
const SoloSpecialMonsters = ["phoenix"];
//////

///     combat behaviour settings       ///
const PullIndescritely = true;  //  if false, party members will wait for the party leader to pick a target before attacking
const UseThreeShot = true;
const UseAbsorbSins = true;
const UseReflection = false;
const DontKite = [];   //  any monsters to never kite
const AvoidMonsters = ["plantoid"];
//////

///     party/character settings      ///
const MerchantName = "LotusMerch";
const MageName = "LotusMage";
const RangerName = "LotusRanger", RangerTwoName = "RangerLotus";
const PriestName = "LotusPriest";
const PartyLeader = RangerTwoName;
const PartyList = [RangerName, MageName, RangerTwoName];
const SoloCharacter = ""//RangerTwoName;

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
const MerchantItems = ["stand0", "scroll0", "scroll1", "cscroll0", "cscroll1", "seashell", "leather", "ascale", "cscale", "bfur", "pleather"];
const Potions = ["hpot1", "mpot1"];
const ItemsToHoldOnTo = ["tracker"];
const WhiteList = [MerchantName];
//////

Potions.forEach(x => { ItemsToHoldOnTo.push(x) });
Elixirs.forEach(x => { MerchantItems.push(x) });
Elixirs.forEach(x => { BuyFromPonty.push(x) });
BasicItemsToCraft.forEach(x => { ItemsToUpgrade.push(x) });
ItemsToUpgrade.forEach(x => { BuyFromPonty.push(x) });
ItemsToCompound.forEach(x => { BuyFromPonty.push(x) });
PartyList.forEach(x => { WhiteList.push(x) });
if(SoloCharacterActive)
{
	WhiteList.push(SoloCharacter);
}