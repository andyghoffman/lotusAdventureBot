load_code("functions");
load_code("priestLogic");
load_code("merchantLogic");
load_code("mageLogic");
load_code("rangerLogic");

///     crafting settings       ///
const craftingEnabled = true;
const minimumGold = 1000000;    //  merchant won't go below this amount of gold in wallet
var basicItemsToCraft = [];   //  keep buying and upgrading these
var itemsToUpgrade = ["wattire","wgloves","wbreeches","wshoes","wcap","mushroomstaff","shield","quiver"];
var upgradeLevelToStop = 7;
var upgradeLevelToUseTierTwoScroll = 6;
var itemsToCompound = ["intring","strring","dexring","ringsj","intearring","dexearring","dexamulet","intamulet","orbofint","orbofdex","dexbelt","intbelt"];
var compoundLevelToStop = 2;
var vendorTrash = ["cclaw","hpamulet","hpbelt","vitring","vitearring","vitscroll"];
var buyFromPontyList = ["firestaff","suckerpunch","t2dexamulet","t2intamulet","rabbitsfoot","ringofluck","cape","ecape","angelwings","bcape","orbg","hbow","t2bow"];
basicItemsToCraft.forEach(x=>{itemsToUpgrade.push(x)});
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
const fullAuto = true;  //  if true will automatically start farming on connect & startup. set false to have player control on startup
const farmMode = "name";
const farmMonsterName = "crabx";
const farmMap = "winterland";   //  only used if farmMode is 'coords' or 'number'
const farmMonsterSpawnNumber = 6;   //  only used if farmMode is 'number'
const farmCoords = {x:1312.8, y:-853.8};    //  only used if farmMode is 'coords'
const specialMonsters = ["snowman","phoenix"];
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
const minimumMonsterDistance = 15;
const lowInventoryThreshold = 14;
const monsterHpThresholdForSkills = 0.5;
const healthPotThreshold = 0.8, manaPotThreshold = 0.8;
const whiteList = [merchantName, mageName, rangerName, priestName];
const itemsToHoldOnTo = ["hpot0","mpot0","stand0","scroll0","scroll1","cscroll0","cscroll1"];
const scrolls = ["scroll0","scroll1","cscroll0","cscroll1"];
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
var banking = false;
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

    //  don't walk with merchant stand, don't idle without it
    if(character.name == merchantName)
    {
        standCheck();
    }
    //  make sure you heal even if you are moving
    else if(character.name == priestName)
    {
        autoHeal();
    }
    //  make sure you attack even if you are moving
    if(get_targeted_monster())
    {
        autoAttack(get_targeted_monster());
    }

    //  finish what you are doing before checking past here
    if(is_moving(character) || smart.moving || returningToTown || character.q.upgrade || character.q.compound)
    {
        return;
    }

    //  standard routines
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
            //  party leader will only aloneCheck if autoplay is active, other characters will tether to leader regardless of autoplay
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

    let target = get_targeted_monster();


    //  look for the monster you are farming
    if(!target)
    {
        //  look for any special targets
        for(let i = 0; i < specialMonsters.length; i++)
        {
            target = getMonsterFarmTarget(specialMonsters[i]);
            if(target && specialMonsters.includes(target.name))
            {
                broadCastTarget(target);
                break;
            }
        }

        if(!target)
        {
            target = getMonsterFarmTarget(farmMonsterName);
        }
    }5

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

        //  keep personal space
        personalSpace();
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

        //  keep personal space
        personalSpace();

        //  if leader is too far away approach him
        if(parent.entities[partyLeader] && distance(character, parent.entities[partyLeader]) > minimumMonsterDistance*2)
        {
            followLeader();
        }
    }
}

// called every 5000ms
function lateUpdate()
{
    if(character.rip || character.q.upgrade || character.q.compound)
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
    {
        return;
    }

    //  check if you need anything
    checkPotionInventory();
    checkBuffs();

    //  if the merchant is nearby, send him your items (token minimum amount so it doesn't get spammed)
    if(parent.entities[merchantName] && character.gold > 10000)
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