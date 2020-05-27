load_code("functions");
load_code("priestLogic");
load_code("merchantLogic");
load_code("mageLogic");
load_code("rangerLogic");

var autoPlay = false;
var aloneChecking = false;
var farmingModeActive = false;

const farmMonsterName = "arcticbee";
const farmMap = "winterland";
const farmMonsterNr = 6;
const farmCoords = {x:1312.8,y:-853.8}
const healthPotThreshold = 0.8, manaPotThreshold = 0.8;
const merchantName = "LotusMerch";
const mageName = "LotusMage";
const rangerName = "LotusRanger";
const priestName = "LotusPriest";
const partyLeader = priestName;

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
	
	if(character.ctype != "merchant")
	{
        if(character.name == partyLeader && !autoPlay)
        {
            return;
        }

        if(aloneCheck() || !autoPlay || !readyToGo())
        {
            return;
        }
    }
	
	let target = getMonsterFarmTarget(farmMonsterName);
	
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
	if(!autoPlay)
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
        if(partyPresent() && !farmingModeActive)
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
    if(!partyPresent() && !aloneChecking)
    {
        aloneChecking = true;

        setTimeout(function()
        {
            if(!isInTown() && !partyPresent())
            {
                log(character.name + " is lost & returning to town.");
                
                if(get_targeted_monster())
                {
                    goTo("main");
                }
                else
                    use("use_town");
                }

            aloneChecking = false;
            aloneCheck();

        }, msToWait);
        
        return true;
    }

    if(!partyPresent() || aloneChecking)
    {			
        return true;
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