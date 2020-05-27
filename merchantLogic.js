const merchantStand_X = -123.05;
const merchantStand_Y = 59.89;

var lowScrolls = 10;
var scrollsToStock = 100;
var vendorMode = false;
var potionsHeldFor;

function merchantAuto(target)
{
	if(!character.s.mluck)
		use_skill("mluck", character);
	
	//if(vendorMode)
		//return;
	
	parent.party_list.forEach(function(otherPlayerName)
	{
		let partyMember = parent.entities[otherPlayerName];
		
		if(partyMember)
		{
			if(!partyMember.s.mluck && is_in_range(partyMember, "mluck"))
			{
				log("Giving mluck to " + partyMember.name);
				use_skill("mluck", partyMember);				
			}
		}
	});
}

function merchantLateUpdate()
{
	stockScrolls();
	
	if(potionsHeldFor != null && potionsHeldFor.length > 0)
	{
		closeMerchantStand();
		requestMagiPort();
	}
}

function merchant_on_cm(name, data)
{
	if(data.message == "buyPots")
	{
		if(potionsHeldFor && checkPotionRequestsFor(name))
		{
			log("Already have potion request from " + name);
			return;
		}
		
		log("Recieved potion request from " + name);
		buyPotionsFor(name, data.hPots, data.mPots);
	}
	else if(data.message == "mluck")
	{
		log("Recieved mluck request from " + name);
		
		vendorMode = false;
		closeMerchantStand();
		requestMagiPort();
	}
}

function merchant_on_magiport(name)
{
	accept_magiport(name);
	
	if(potionsHeldFor != null && potionsHeldFor.length > 0)
	{
		setTimeout(deliverPotions, 2000);		
	}
	else
	{
		setTimeout(returnToTown, 5000);
	}
}

function checkPotionRequestsFor(name)
{
	if(!potionsHeldFor || potionsHeldFor.length == 0)
		return;
	
	for(let i = 0; i < potionsHeldFor.length; i++)
	{
		if(potionsHeldFor[i].name == name)
			return true;
	}
	
	return false;
}

function craftUpgradedWeapon(weapon, upgradeLevel)
{
	upgrade(locate_item(weapon), locate_item("scroll0"));
	return;
	
	let baseWeaponsNeeded = 0;
	let baseWeaponsHave = quantity(weapon);
	
	baseWeaponsNeeded = (upgradeLevel+1) - baseWeaponsHave;
	
	//buy_with_gold(weapon, baseWeaponsNeeded);
	
	for(let i = 0; i < upgradeLevel; i++)
	{
		upgrade(locate_item(weapon), locate_item("scroll0"));
	}
}

function stockScrolls()
{
	let	scrolla = quantity("scroll0");
	let scrollb = quantity("cscroll0");

	if(scrolla < lowScrolls)
	{
		let scrollaAmount = scrollsToStock-scrolla;
		buy_with_gold("scroll0", scrollaAmount);
		log("Buying " + scrollaAmount + " upgrade scrolls");		
	}
	
	if(scrollb < lowScrolls)
	{
		let scrollbAmount = scrollsToStock-scrolla;
		buy_with_gold("cscroll0", scrollbAmount);
		log("Buying " + scrollbAmount + " compound scrolls");		
	}
}

function returnToTown(delay)
{
	if(character.map == "main")
	{	
		setTimeout(function()
		{
			use("use_town");
			setTimeout(openMerchantStand, delay);
		}, delay);
	}
	else
	{
		setTimeout(function()
		{
			use("use_town");
			setTimeout(goTo("main",
							{x:merchantStand_X,y:merchantStand_Y},
							openMerchantStand), 10000);			
		}, delay);
	}
}

function buyPotionsFor(name, healthPots, manaPots)
{
	let hPotsAlreadyHave = quantity("hpot0");
	let mPotsAlreadyHave = quantity("mpot0");
	
	if(healthPots > hPotsAlreadyHave)
	{
		let hpotAmount = healthPots-hPotsAlreadyHave;
		buy_with_gold("hpot0", hpotAmount);
		log("Buying " + hpotAmount + " health potions");
	}
	
	if(manaPots > mPotsAlreadyHave)
	{
		let mpotAmount = manaPots-mPotsAlreadyHave;
		buy_with_gold("mpot0", manaPots-mPotsAlreadyHave);
		log("Buying " + mpotAmount + " mana potions");		
	}
	
	if(potionsHeldFor == null)
	{
		potionsHeldFor = [];
	}
	
	let order = {name:name, hPots:healthPots, mPots:manaPots};
	potionsHeldFor.push(order);
}

function deliverPotions()
{
	if(potionsHeldFor == null)
	{
		log("deliverPotions called but shopping list is null!");
		return;
	}
	
	parent.party_list.forEach(function(otherPlayerName)
	{
		let partyMember = parent.entities[otherPlayerName];
		
		if(partyMember)
		{
			for(let i = 0; i < potionsHeldFor.length; i++)
			{
				if(partyMember.name == potionsHeldFor[i].name)
				{
					send_item(partyMember,locate_item("hpot0"),
					potionsHeldFor[i].hPots);
					send_item(partyMember,locate_item("mpot0"),
					potionsHeldFor[i].mPots);
				}
			}
		}
	});
	
	potionsHeldFor = [];
	
	returnToTown(2500);
}

function openMerchantStand()
{
	vendorMode = true;
	returningToTown = false;
	
	smart_move({x: merchantStand_X, y: merchantStand_Y}, () => 
	{
		parent.open_merchant(41);
	});
}

function closeMerchantStand()
{
	vendorMode = false;
	parent.close_merchant();
}