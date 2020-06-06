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

onStart();

//  called once on initialization
function onStart()
{
	if (character.name === MerchantName)
	{
		merchantOnStart();
		setInterval(main, 250);
		setInterval(merchantLateUpdate, 5000);
	}
	else if(PartyList.includes(character.name))
	{
		setInterval(main, 250);
		setInterval(lateUpdate, 5000);
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
	
	target = dropInvalidTarget(target);

	loot();
	usePotions();
	
	if (AutoPlay)
	{
		tidyInventory();
	}

	//  make sure party is together
	if (!Traveling && character.name !== MerchantName && (!AutoPlay || !readyToGo() || !FarmingModeActive || !partyPresent()))
	{
		//  party leader will only aloneCheck if autoplay is active, other characters will tether to leader regardless of autoplay
		if ((character.name !== PartyLeader) || (character.name === PartyLeader && AutoPlay))
		{
			aloneCheck();
		}

		return;
	}
	
	if((AutoPlay && !Traveling && !GoingBackToTown) || character.name === MerchantName)
	{
		classRoutine(target);	
	}
	else if(character.name === PriestName)
	{
		autoHeal();
	}

	if (is_moving(character) || smart.moving || GoingBackToTown || Traveling || character.q.upgrade || character.q.compound || character.name === MerchantName)
	{
		return;
	}
	
	if (!Traveling && !target)
	{
		log(character.name + " going to farm map... ");
		travelToFarmSpot();
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