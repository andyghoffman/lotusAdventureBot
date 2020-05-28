load_code("functions");
load_code("priestLogic");
load_code("merchantLogic");
load_code("mageLogic");
load_code("rangerLogic");

///     crafting settings       ///
var itemToUpgrade = "wshield";
var upgradeLevelToStop = 7;
var itemsToCompound = ["intring","strring","dexring","vitring"];
var compoundLevelToStop = 2;
const craftingEnabled = false;
const minimumGold = 5000000;
//////

///     farming settings        ///
const farmMonsterName = "arcticbee";
const farmMap = "winterland";
const farmMonsterNr = 6;
const farmCoords = {x:1312.8, y:-853.8}
const specialMonsters = ["snowman"];
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
//////

map_key("1", "snippet", "initParty()")
map_key("2", "snippet", "initParty()")
map_key("3", "snippet", "stopCharacters()")
map_key("4", "snippet", "transferAllToMerchant()")
map_key("5", "snippet", "toggleAutoPlay()")
map_key("6", "snippet", "toggleCraftingMode()")
map_key("0", "snippet", "test()")

var autoPlay = false;
var aloneChecking = false;
var farmingModeActive = false;
var craftingOn = craftingEnabled;

setInterval(main, 250);
setInterval(lateUpdate, 5000);

function test()
{
	let item = locate_item("staff");

	if(item_properties(character.items[item]).level < 7)
		upgrade(item, locate_item("scroll0"));
}

//  called every 250ms
function main()
{
    if (character.rip)
    {
        setTimeout(respawn, 15000);
    }

    if(is_moving(character) || smart.moving)
    {
		return;
    }

    //  standard routine
    usePotions(healthPotThreshold, manaPotThreshold);
    loot();

	if(character.ctype != "merchant")
	{
        //  autofollow leader when not auto-farming
        if(character.name != partyLeader && !farmingModeActive && parent.entities[partyLeader])
        {
            followLeader();
            return;
        }

        //  make sure party is together
        if(!autoPlay || !readyToGo() || !farmingModeActive)
        {
            if((character.name != partyLeader) || (character.name == partyLeader && autoPlay))
            {
                aloneCheck();
            }

            return;
        }
    }
    //  merchant standard routine
    else if(character.ctype === "merchant")
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
	if(character.ctype === "priest")
	{
		if(target)
		{
			priestAuto(target);
		}
		else if(!traveling)
		{
            log(character.name + " going to map... ");
			goTo(farmMap, farmCoords);
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
            log(character.name + " going to map... ");
            goTo(farmMap, farmCoords);
        }

        //  if leader is too far away approach him
        if(!traveling)
        {
            tetherToLeader();
        }
	}
}

// called every 5000ms
function lateUpdate()
{
    checkSentRequests();

    if(character.name == partyLeader && !partyPresent())
    {
        initParty();
    }

	if(!autoPlay && character.ctype != "merchant")
		return;

	if(is_moving(character) || smart.moving)
		return;

	if(character.ctype != "merchant")
	{
        //  check if you need anything
		checkPotionInventory();
        checkBuffs();

        //  if the merchant is nearby, send him your items
        if(parent.entities[merchantName])
        {
            transferAllToMerchant();
        }
	}
	else if(character.ctype === "merchant")
	{
        //  merchant update is delayed an additional 1000ms so if requests are sent in the same interval merchant doesnt have to wait an additioanl interval
		setTimeout(merchantLateUpdate, 1000);
	}

    //  party leader keeps things in check
	if(character.name == partyLeader)
	{
        if(readyToGo() && partyPresent() && !farmingModeActive && !aloneChecking)
        {
            letsGo();
        }
        else if(character.name == partyLeader && partyPresent() && !farmingModeActive)
		{
			readyCheck();
		}
    }
}

//  check if you are separated from the party, and attempt to regroup in town if you are.
//  returns true if the character is alone, false if not
function aloneCheck(msToWait = 15000)
{
    if(is_moving(character) || smart.moving)
    {
        return false;
    }

    if(!partyPresent() && !aloneChecking)
    {
        if(character.name != partyLeader)
        {
            if(parent.entities[partyLeader])
            {
                followLeader();
                return false;
            }
        }

        aloneChecking = true;
        log(character.name + " is checking if they are lost...");

        setTimeout(function()
        {
            if(character.name != partyLeader && parent.entities[partyLeader])
            {
                aloneChecking = false;
                followLeader();
                return false;
            }

            if(!isInTown() && !partyPresent() && aloneChecking)
            {
                log(character.name + " is lost & returning to town.");

                stopFarmMode();

                if(get_targeted_monster())
                {
                    goTo("main");
                }
                else
                {
                    use("use_town");
                    setTimeout(goTo("main"), 7500);
                }
            }

            aloneChecking = false;

        }, msToWait);

        return true;
    }

    if(!partyPresent() || aloneChecking)
    {
        return true;
    }
    else
    {
        return false;
    }
}

function letsGo()
{
	log("Let's go!");

	send_cm(mageName, {message:"letsgo"});
	send_cm(rangerName, {message:"letsgo"});

	farmingModeActive = true;
}

function toggleAutoPlay()
{
    autoPlay = !autoPlay;

    if(character.name == partyLeader)
    {
        send_cm(mageName, {message:"autoToggle",auto:autoPlay});
        send_cm(rangerName, {message:"autoToggle",auto:autoPlay});

        log("sending autoPlayToggle to Mage & Ranger");
    }

    log("autoPlay: " + autoPlay);
}