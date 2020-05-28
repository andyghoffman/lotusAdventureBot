const merchantStand_X = -123.05;
const merchantStand_Y = 59.89;

var lowScrolls = 10;
var scrollsToStock = 100;
var vendorMode = false;	//	true when in town with shop, false when busy delivering items
var returningToTown = false;	//	true when merchant is on it's way back to town
var potionsHeldFor = [];

function merchantAuto(target)
{
	if(isInTown() && !vendorMode && !returningToTown)
	{
		enableVendorMode();
	}

	if(!character.s.mluck)
		use_skill("mluck", character);

	parent.party_list.forEach(function(otherPlayerName)
	{
		let partyMember = parent.entities[otherPlayerName];

		if(partyMember)
		{
			if(!partyMember.s.mluck || checkPotionRequestsFor(partyMember.name))
			{
				if(is_in_range(partyMember, "mluck"))
				{
					if(!partyMember.s.mluck)
					{
						log("Giving mluck to " + partyMember.name);
						use_skill("mluck", partyMember);
					}
					else if(checkPotionRequestsFor(partyMember.name))
					{
						deliverPotions();
					}

				}
				else
				{
					smart_move(
						character.x + (partyMember.x - character.x) * 0.3,
						character.y + (partyMember.y - character.y) * 0.3
					);
				}
			}
		}
	});
}

function merchantLateUpdate()
{
	stockScrolls();

	if(potionsHeldFor.length > 0 && vendorMode && !returningToTown)
	{
		disableVendorMode();
		requestMagiPort();
	}

	if(!vendorMode && !returningToTown)
	{
		if(parent.party_list.every(function(p)
		{
			let partyMember = parent.entities[p];
			return (partyMember && partyMember.s.mluck);
		}) && potionsHeldFor.length == 0 && !isInTown() && !vendorMode)
		{
			returnToTown();
		}
	}

	if(vendorMode)
	{
		if(locate_item("staff") != -1)
		{
			log("Upgrading staff...");
			craftUpgradedWeapon(locate_item("staff"), 7);
		}
	}
}

function merchant_on_cm(name, data)
{
	if(data.message == "buyPots" && vendorMode)
	{
		if(potionsHeldFor && checkPotionRequestsFor(name))
		{
			log("Already have potion request from " + name);
			return;
		}

		log("Recieved potion request from " + name);
		buyPotionsFor(name, data.hPots, data.mPots);
	}
	else if(data.message == "mluck" && vendorMode)
	{
		log("Recieved mluck request from " + name);

		disableVendorMode();
	}
}

function merchant_on_magiport(name)
{
	accept_magiport(name);
}

function checkPotionRequestsFor(name)
{
	if(potionsHeldFor.length == 0)
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
	if(item_properties(character.items[weapon]).level < 7)
		upgrade(weapon, locate_item("scroll0"));
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
	if(returningToTown)
		return;

	returningToTown = true;

	if(character.map == "main")
	{
		setTimeout(function()
		{
			use("use_town");
			setTimeout(enableVendorMode, delay);
		}, delay);
	}
	else
	{
		setTimeout(function()
		{
			use("use_town");
            setTimeout(function()
            {
                goTo("main",{x:merchantStand_X,y:merchantStand_Y},enableVendorMode);
            }, 10000);

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

	let order = {name:name, hPots:healthPots, mPots:manaPots};
	potionsHeldFor.push(order);
}

function deliverPotions()
{
	if(potionsHeldFor == null || potionsHeldFor == [])
	{
		log("deliverPotions called but shopping list is empty!");
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

function enableVendorMode()
{
	log("Merchant returning to vendor mode.");

	smart_move({x: merchantStand_X, y: merchantStand_Y}, () =>
	{
		log("Merchant entered vendor mode.");
		parent.open_merchant(41);
		vendorMode = true;
		returningToTown = false;
	});
}

function disableVendorMode()
{
	log("Merchant exited vendor mode.");

	parent.close_merchant();
	vendorMode = false;
}

function dontWalkWithShop()
{
	if(character.stand && !vendorMode)
	{
		parent.close_merchant();
	}
}