load_code("botSettings");
load_code("functions");
load_code("priestLogic");
load_code("merchantLogic");
load_code("mageLogic");
load_code("rangerLogic");

map_key("1", "snippet", "initParty()");
map_key("2", "snippet", "townParty()");
map_key("3", "snippet", "stopCharacters()");
map_key("4", "snippet", "transferAllToMerchant()");
map_key("5", "snippet", "togglePartyAuto()");
map_key("6", "snippet", "toggleCraftingMode()");
map_key("7", "snippet", "depositInventoryAtBank()");
map_key("8", "snippet", "xpReport()");

var autoPlay = fullAuto;
var craftingOn = craftingEnabled;
var whosReady = {leader:false,merchant:false,codeBotOne:false,codeBotTwo:false};
var sentRequests = [];
var aloneChecking = false;
var farmingModeActive = false;
var readyChecking = false;
var traveling = false;
var returningToTown = false;
var banking = false;
var noElixirs = false;

setInterval(main, 250);
setInterval(lateUpdate, 5000);

//  called on initialization
onStart();
function onStart()
{
    if(character.name == merchantName)
    {
        merchantOnStart();
    }
}

//  called every 250ms
function main()
{
    if (character.rip)
    {
        setTimeout(respawn, 15000);
        return;
    }

    //  don't walk with merchant stand, don't idle without it
    if(character.name == merchantName)
    {
        standCheck();
    }
    //  prioritize priest functions before anything else (because heal shares a cooldown with autoattack)
    else if(character.name == priestName)
    {
        priestAuto(get_targeted_monster());
    }
    //  make sure you attack even if you are moving (normal routine is not called while moving)
    else if(get_targeted_monster())
    {
        autoAttack(get_targeted_monster());
    }

    loot();
    usePotions(healthPotThreshold, manaPotThreshold);

    if(autoPlay)
    {
        tidyInventory();
    }

    //  finish what you are doing before checking past here
    if(is_moving(character) || smart.moving || returningToTown || character.q.upgrade || character.q.compound)
    {
        return;
    }

    //  merchant standard routine
    if(character.name == merchantName)
	{
        merchantAuto();
        return;
    }
    //  standard routine for party group
    else
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

    //  look for a target
    let target = get_targeted_monster();
    if(!target)
    {
        target = lookForSpecialTargets();

        if(!target)
        {
            canPullNew = character.name == partyLeader;
            target = getTargetMonster(farmMonsterName, canPullNew);
        }
    }

    //  if the monster is targeting another player, drop the target unless it's a special monster
    target = dropInvalidTarget(target);

    if(target)
    {
        classRoutine(target);
    }
    else if(!traveling)
    {
        if(character.name != partyLeader && parent.entities[partyLeader] && distance(character, parent.entities[partyLeader]) < 400 && character.map == farmMap)
        {
            followLeader();
        }
        else
        {
            log(character.name + " going to farm map... ");
            travelToFarmSpot();
        }
    }

    //  keep personal space
    personalSpace();

    //  if leader is too far away approach him
    if(character.name != partyLeader)
    {
        followLeader();
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

    if(character.name == partyLeader && !partyPresent() && autoPlay)
    {
        initParty();
    }

    //  merchant has it's own lateUpdate
    if(character.name == merchantName)
	{
        merchantLateUpdate();
        return;
	}

    //  don't do anything past here if autoPlay is off
    if(!autoPlay)
    {
        return;
    }

    //  if the merchant is nearby, send him your items & gold (token minimum gold amount so it doesn't get spammed)
    if(parent.entities[merchantName] && character.gold > 10000)
    {
        transferAllToMerchant();
    }

    if(is_moving(character) || smart.moving)
    {
        return;
    }

    //  check if you need anything
    checkIfReady();

    //  party leader keeps things in check
	if(character.name == partyLeader)
	{
        if(readyToGo() && partyPresent() && !farmingModeActive)
        {
            letsGo();
        }
        else if(partyPresent() && !farmingModeActive)
        {
            sendReadyCheck();
        }
    }
}