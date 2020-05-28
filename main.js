load_code("functions");
load_code("priestLogic");
load_code("merchantLogic");
load_code("mageLogic");
load_code("rangerLogic");

///     crafting settings       ///
const craftingEnabled = true;
const itemToCraft = "bow";
const upgradeLevelToStop = 8;
const minimumGold = 5000000;
//////

///     farming settings        ///
const farmMonsterName = "arcticbee";
const farmMap = "winterland";
const farmMonsterNr = 6;
const farmCoords = {x:1312.8,y:-853.8}
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
const merchantStand_X = -123.05;
const merchantStand_Y = 59.89;
//////

map_key("1", "snippet", "loadCharacters()")
map_key("2", "snippet", "initParty()")
map_key("3", "snippet", "stopCharacters()")
map_key("4", "snippet", "transferAllToMerchant()")
map_key("5", "snippet", "toggleAutoPlay()")
map_key("0", "snippet", "test()")

var autoPlay = false;
var aloneChecking = false;
var farmingModeActive = false;

setInterval(main, 250);
setInterval(lateUpdate, 5000);

function test()
{
	let item = locate_item("staff");

	if(item_properties(character.items[item]).level < 7)
		upgrade(item, locate_item("scroll0"));
}

function main()
{
    if (character.rip)
        setTimeout(respawn, 15000);

    if(is_moving(character) || smart.moving)
		return;

    usePotions(healthPotThreshold, manaPotThreshold);
    loot();

	if(character.ctype != "merchant")
	{
        if(aloneCheck(15000) || !autoPlay || !readyToGo() || !farmingModeActive)
        {
            return;
        }
    }
    else if(character.ctype === "merchant")
	{
        merchantAuto();
        return;
	}

    let target = getMonsterFarmTarget(specialMonsters[0]);

    if(!target)
    {
        target = getMonsterFarmTarget(farmMonsterName);
    }

    if(target && !is_moving(character) && !smart.moving)
    {
        personalSpace();
    }

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

        if(!is_moving(character) && !smart.moving)
        {
            tetherToLeader();
        }
	}
}

function lateUpdate()
{
    checkSentRequests();

	if(!autoPlay && character.ctype != "merchant")
		return;

	if(is_moving(character) || smart.moving)
		return;

	if(character.ctype != "merchant")
	{
		checkPotionInventory();
		checkBuffs();
	}
	else if(character.ctype === "merchant")
	{
		setTimeout(merchantLateUpdate, 1000);
	}

	if(character.name == partyLeader && readyToGo())
	{
        if(partyPresent() && !farmingModeActive && !aloneChecking)
        {
            letsGo();
        }
    }
    else if(!readyToGo())
	{
		if(character.name == partyLeader && partyPresent() && !farmingModeActive)
		{
			readyCheck();
		}
	}
}

function aloneCheck(msToWait = 15000)
{
    if(is_moving(character) || smart.moving)
    {
        return false;
    }

    if(!partyPresent() && !aloneChecking)
    {
        if(character.name == partyLeader)
        {
            initParty();
        }
        else if(character.name != partyLeader)
        {
            if(parent.entities[get_player(partyLeader)])
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
    5
    if(character.name == partyLeader)
    {
        send_cm(mageName, {message:"autoToggle",auto:autoPlay});
        send_cm(rangerName, {message:"autoToggle",auto:autoPlay});

        log("sending autoPlayToggle to Mage & Ranger");
    }

    log("autoPlay: " + autoPlay);
}