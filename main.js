load_code("functions");
load_code("priestLogic");
load_code("merchantLogic");
load_code("mageLogic");
load_code("rangerLogic");

///     crafting settings       ///
const craftingEnabled = true;
const minimumGold = 5000000;
var itemsToUpgrade = ["wattire","wgloves","wbreeches","wshoes","wcap"];
var upgradingBuyableItem = [false,false,false,false,false]; //  if true will attempt to buy base items to continue crafting
var upgradeLevelToStop = 7;
var itemsToCompound = ["intring","strring","dexring","vitring","ringsj"];
var compoundLevelToStop = 2;
var vendorTrash = ["cclaw","hpamulet","hpbelt"];
var buyFromPontyList = [];
itemsToUpgrade.forEach(x=>{buyFromPontyList.push(x)});
itemsToCompound.forEach(x=>{buyFromPontyList.push(x)});
//////

///     farming settings        ///
///     farmMode:
///     name = travel to any spawn of the farmMonster, will change if there is more than 1. ideal if only one spawn location
///     coords = travel to farmMap and farmCoords
///     number = travel to the spawn # of farmMonsterSpawnNumber
///
///     specialMonsters are prioritized if they are present
const fullAuto = true; //  if true will automatically start farming on connect & startup. set false to have player control on startup
const farmMode = "name";
const farmMonsterName = "crabx";
const farmMap = "winterland";           //  only used if farmMode is 'coords' or 'number'
const farmMonsterSpawnNumber = 6;       //  only used if farmMode is 'number'
const farmCoords = {x:1312.8, y:-853.8} //  only used if farmMode is 'coords'
const specialMonsters = ["snowman","phoenix"];
const healthPotThreshold = 0.8, manaPotThreshold = 0.8;
//////

///     character settings      ///
const merchantName = "LotusMerch";
const mageName = "LotusMage";
const rangerName = "LotusRanger";
const priestName = "LotusPriest";
const partyLeader = priestName;
const merchantStandMap = "main";
const merchantStandCoords = {x:-118, y:11};
const healthPotionsToHave = 1000;
const manaPotionsToHave = 1000;
const lowPotions = 100;
const spaceToKeep = 10;
const whiteList = [merchantName, mageName, rangerName, priestName];
//////

map_key("1", "snippet", "initParty()")
map_key("2", "snippet", "returnPartyToTown()")
map_key("3", "snippet", "stopCharacters()")
map_key("4", "snippet", "transferAllToMerchant()")
map_key("5", "snippet", "toggleAutoPlay()")
map_key("6", "snippet", "toggleCraftingMode()")
map_key("0", "snippet", "test()")

var autoPlay = fullAuto;
var aloneChecking = false;
var farmingModeActive = false;
var craftingOn = craftingEnabled;
var whosReady = {priest:false,mage:false,ranger:false,merchant:false};
var traveling = false;
var returningToTown = false;
var sentRequests = [];

setInterval(main, 250);
setInterval(lateUpdate, 5000);

//  called every 250ms
function main()
{
    if (character.rip)
    {
        setTimeout(respawn, 15000);
        return;
    }

    //  standard routine
    usePotions(healthPotThreshold, manaPotThreshold);
    loot();
    if(autoPlay)
    {
        tidyInventory();
    }

    if(is_moving(character) || smart.moving || returningToTown)
    {
        if(character.name == merchantName)
        {
            dontWalkWithShop();
        }

        return;
    }

	if(character.name != merchantName)
	{
        //  autofollow leader when not auto-farming
        if(character.name != partyLeader && !farmingModeActive && parent.entities[partyLeader])
        {
            followLeader();
            return;
        }

        //  make sure party is together
        if(!autoPlay || !readyToGo() || !farmingModeActive || !partyPresent())
        {
            if((character.name != partyLeader) || (character.name == partyLeader && autoPlay))
            {
                aloneCheck();
            }

            return;
        }
    }
    //  merchant standard routine
    else if(character.name == merchantName)
	{
        merchantAuto();
        return;
    }

    let target = null;

    //  look for any special targets
    for(let i = 0; i < specialMonsters.length; i++)
    {
        target = getMonsterFarmTarget(specialMonsters[i]);
    }

    //  look for the monster you are farming
    if(!target)
    {
        target = getMonsterFarmTarget(farmMonsterName);
    }

    //  try to keep monsters away from your face
    if(target && !is_moving(character) && !smart.moving)
    {
        personalSpace();
    }

    //  party leader standard routine
	if(character.name == partyLeader)
	{
		if(target)
		{
			priestAuto(target);
		}
		else if(!traveling)
		{
            log(character.name + " going to farm map... ");
            travelToFarmSpot();
		}
    }
    //  party follower routines
	else
	{
		if(target)
		{
			if(character.ctype === "ranger")
			{
				rangerAuto(target);
			}
			else if(character.ctype === "mage")
			{
				mageAuto(target);
            }
		}
		else if(!traveling)
		{
            log(character.name + " going to farm map... ");
            travelToFarmSpot();
        }

        //  if leader is too far away approach him
        if(!traveling)
        {
            if(parent.entities[partyLeader] && distance(character, parent.entities[partyLeader]) > spaceToKeep*2)
            {
                followLeader();
            }
        }
	}
}

// called every 5000ms
function lateUpdate()
{
    if(character.rip)
    {
        return;
    }

    checkSentRequests();

    if(character.name == partyLeader && !partyPresent())
    {
        initParty();
    }

    if(character.ctype === "merchant")
	{
        //  merchant update is delayed an additional 1000ms so if requests are sent in the same interval merchant doesnt have to wait an additioanl interval
        setTimeout(merchantLateUpdate, 1000);
        return;
	}

    //  don't do anything past here if autoPlay is off, or if you are moving
	if(!autoPlay || is_moving(character) || smart.moving)
        return;

    //  check if you need anything
    checkPotionInventory();
    checkBuffs();

    //  if the merchant is nearby, send him your items
    if(parent.entities[merchantName])
    {
        transferAllToMerchant();
    }

    //  party leader keeps things in check
	if(character.name == partyLeader)
	{
        if(readyToGo() && partyPresent() && !farmingModeActive && !aloneChecking)
        {
            letsGo();
        }
        else if(partyPresent() && !farmingModeActive)
		{
			readyCheck();
		}
    }
}