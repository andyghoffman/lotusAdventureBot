load_code("functions");
load_code("priestLogic");
load_code("merchantLogic");
load_code("mageLogic");
load_code("rangerLogic");

var autoPlay = true;
var aloneCheck = false;
var started = false;

const farmMonsterName = "arcticbee";
const farmMap = "winterland";
const farmMonsterNr = 6;
const farmCoords = {x:1312.8,y:-853.8}
const healthPotThreshold = 0.8, manaPotThreshold = 0.8;
const merchantName = "LotusMerch";
const mageName = "LotusMage";
const rangerName = "LotusRanger";
const priestName = "LotusPriest";

map_key("1", "snippet", "loadCharacters()")
map_key("2", "snippet", "initParty()")
map_key("3", "snippet", "stopCharacters()")
map_key("4", "snippet", "transferAllToMerchant()")
map_key("5", "snippet", "toggleAutoPlay()")
map_key("0", "snippet", "test()")

setInterval(main, 250);
setInterval(lateUpdate, 15000);

function test()
{
	/*let item = locate_item("staff");
	
	if(item_properties(character.items[item]).level < 7)
		upgrade(item, locate_item("scroll0"));*/
	
	let message = {message:"test",content:"oh"};
	send_cm("LotusMage", message);
}

function main()
{
    if (character.rip) 
		setTimeout(respawn, 15000);  
    
    if(is_moving(character) || smart.moving)
		return;
	
    usePotions(healthPotThreshold, manaPotThreshold);
    loot();
	//followLeader();
	//personalSpace();
	
	if(character.ctype != "merchant")
	{
		if(!autoPlay)
		{
			return;
		}

		if(!partyPresent() && !aloneCheck)
		{
			aloneCheck = true;
			//log(character.name + " looking for party...");
			
			setTimeout(function()
			{
				if(!isInTown() && !partyPresent())
				{
					log(character.name + " returning to town.");
					
					if(character.map == "main" && !isInTown())
					{
						if(get_targeted_monster())
							goTo("main");
						else
							use("use_town");						
					}
					else
					{
						if(get_targeted_monster())
							goTo("main");
						else
						{
							use("use_town");
							setTimeout(goTo("main"), 5000);							
						}
					}
				}
				
				aloneCheck = false;
				
			}, 15000);
			
			return;
		}

		if(!readyToGo() || !partyPresent() || aloneCheck)
		{			
			return;		
		}
		
		if(character.ctype === "priest" && !started)
			return;
	}
	
	let target = getTarget(farmMonsterName);
	
	if(character.ctype === "priest")
	{
		if(target)
		{
			priestAuto(target);
		}
		else
		{
			goTo(farmMap, farmCoords);
		}
	}
	else if(character.ctype === "merchant")
	{
		merchantAuto(target);
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
		else
		{
			goTo(farmMap, farmCoords);
		}
	}
}

function lateUpdate()
{
	if(parent.party_list.length < 4 || !autoPlay)
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
	
	if(!readyToGo())
	{
		if(character.ctype === "priest" && partyPresent() && !started)
		{
			readyCheck();
		}
	}
	else if(readyToGo())
	{
		if(character.ctype === "priest")
		{
			if(partyPresent() && !started)
			{
				letsGo();
			}
		}
	}
}

function letsGo()
{
	log("Let's go!");
		
	send_cm(mageName, {message:"letsgo"});
	send_cm(rangerName, {message:"letsgo"});	
	
	started = true;
}

function toggleAutoPlay()
{
	autoPlay = autoPlay;
	log("autoPlay: " + autoPlay);
}

function getAutoPlay()
{
	return autoPlay;
}