load_code("botSettings");
load_code("functions");
load_code("priestLogic");
load_code("merchantLogic");
load_code("mageLogic");
load_code("rangerLogic");
load_code("logging");
load_code("events");

map_key("1", "snippet", "initParty()");
map_key("2", "snippet", "townParty()");
map_key("3", "snippet", "reloadCharacters()");
map_key("4", "snippet", "transferAllToMerchant()");
map_key("5", "snippet", "togglePartyAuto()");
map_key("6", "snippet", "stopCharacters()");
map_key("7", "snippet", "depositInventoryAtBank()");
map_key("8", "snippet", "xpReport()");

let AutoPlay = FullAuto;
let CraftingOn = CraftingEnabled;
let AloneChecking = false;
let FarmingModeActive = false;
let ReadyChecking = false;
let Traveling = false;
let GoingBackToTown = false;
let Banking = false;
let NoElixirs = false;
let IsStuck = false;
let WhosReady = {leader: false, merchant: false, codeBotOne: false, codeBotTwo: false};
const SentRequests = [];

setInterval(main, 250);
setInterval(lateUpdate, 5000);

//  called on initialization
onStart();
function onStart()
{
	if (character.name === MerchantName)
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

	let target = lookForSpecialTargets();
	
	//  look for a target
	if (!target)
	{
		let canPullNew = character.name === PartyLeader || PullIndescritely;
		target = getTargetMonster(FarmMonsterName, canPullNew);
	}

	loot();
	usePotions();
	
	if(!Traveling)
	{
		classRoutine(target);	
	}

	if (AutoPlay)
	{
		tidyInventory();
	}
	
	if (is_moving(character) || smart.moving || GoingBackToTown || character.q.upgrade || character.q.compound || character.name === MerchantName)
	{
		return;
	}

	//  autofollow leader when not auto-farming
	if (character.name !== PartyLeader && !FarmingModeActive && parent.entities[PartyLeader])
	{
		followLeader();
		return;
	}

	//  make sure party is together
	if (!AutoPlay || !readyToGo() || !FarmingModeActive || !partyPresent())
	{
		//  party leader will only aloneCheck if autoplay is active, other characters will tether to leader regardless of autoplay
		if ((character.name !== PartyLeader) || (character.name === PartyLeader && AutoPlay))
		{
			aloneCheck();
		}

		return;
	}
	
	if (!Traveling && !target)
	{
		if (character.name !== PartyLeader && parent.entities[PartyLeader] && distance(character, parent.entities[PartyLeader]) < 400 && character.map === FarmMap)
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
	if (character.name !== PartyLeader)
	{
		followLeader();
	}
}

// called every 5000ms
function lateUpdate()
{
	if (character.rip || character.q.upgrade || character.q.compound)
	{
		return;
	}

	checkSentRequests();

	if (character.name === PartyLeader && AutoPlay && !partyPresent())
	{
		initParty();
	}

	//  merchant has it's own lateUpdate
	if (character.name === MerchantName)
	{
		merchantLateUpdate();
		return;
	}

	//  don't do anything past here if autoPlay is off
	if (!AutoPlay)
	{
		return;
	}

	//  if the merchant is nearby, send him your items & gold (token minimum gold amount so it doesn't get spammed)
	if (parent.entities[MerchantName] && character.gold > 10000)
	{
		transferAllToMerchant();
	}

	if (is_moving(character) || smart.moving)
	{
		return;
	}

	//  check if you need anything
	checkIfReady();

	//  party leader keeps things in check
	if (character.name === PartyLeader)
	{
		if (readyToGo() && partyPresent() && !FarmingModeActive)
		{
			letsGo();
		}
		else if (partyPresent() && !FarmingModeActive)
		{
			sendReadyCheck();
		}
	}
}