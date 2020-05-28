var lowScrolls = 10;
var scrollsToStock = 100;
var vendorMode = false;	//	true when in town with shop, false when busy delivering items
var returningToTown = false;	//	true when merchant is on it's way back to town
var deliveryMode = false;
var potionShipments = [];
var deliveryRequests = [];

function merchantAuto(target)
{
	if(isInTown() && !vendorMode && !returningToTown && !deliveryMode)
	{
		enableVendorMode();
	}

	if(!vendorMode && parent.stand)
	{
		parent.close_merchant();
	}

	if(!character.s.mluck)
		use_skill("mluck", character);

	parent.party_list.forEach(function(otherPlayerName)
	{
		let partyMember = parent.entities[otherPlayerName];

		if(partyMember)
		{
			if(!partyMember.s.mluck || checkPotionShipments(partyMember.name))
			{
				if(is_in_range(partyMember, "mluck"))
				{
					if(!partyMember.s.mluck)
					{
						log("Giving mluck to " + partyMember.name);
						use_skill("mluck", partyMember);
					}
					else if(checkPotionShipments(partyMember.name))
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
	checkRequests();

	if(deliveryMode && !returningToTown)
	{
		disableVendorMode();
		requestMagiPort();
	}

	if(!isInTown() && !returningToTown && !deliveryMode)
	{
		returnToTown();
	}

	if(vendorMode && craftingEnabled)
	{
		craftUpgradedWeapon(locate_item(itemToCraft), upgradeLevelToStop);
	}
}

function merchant_on_cm(sender, data)
{
	if(data.message == "buyPots")
	{
		if(potionShipments && checkPotionShipments(sender))
		{
			log("Already have potion request from " + sender);
			return;
		}

		log("Recieved potion request from " + sender);
		deliveryRequests.push({request:"potions",sender:sender,fulfilled:false,shipment:null,hPots:data.hPots,mPots:data.mPots});
	}
	else if(data.message == "mluck")
	{
		if(deliveryRequests.find(x=>x.request=="mluck" && x.from==sender))
		{
			log("Already have mluck request from " + sender);
			return;
		}

		log("Recieved mluck request from " + sender);
		deliveryRequests.push({request:"mluck",from:sender});
	}
	else if(data.message == "thanks")
	{
		log("Recieved delivery confirmation from " + sender);
		deliveryRequests.splice(deliveryRequests.indexOf(x=>x.sender == sender && x.request == request));
	}
}

function merchant_on_magiport(name)
{
	if(deliveryMode)
	{
		accept_magiport(name);
	}
}

function checkRequests()
{
	if(deliveryRequests.length > 0)
	{
		deliveryMode = true;

		for(let i = 0; i < deliveryRequests.length; i++)
		{
			if(deliveryRequests[i].shipment || deliveryRequests[i].request == "mluck")
			{
				requestMagiPort();
			}
			else if(deliveryRequests[i].request == "potions")
			{
				buyPotionsFor(deliveryRequests[i].sender, deliveryRequests[i].hPots, deliveryRequests[i].mPots);
			}
		}
	}
	else
	{
		deliveryMode = false;
	}
}

function checkPotionShipments(name)
{
	if(potionShipments.length == 0)
		return;

	for(let i = 0; i < potionShipments.length; i++)
	{
		if(potionShipments[i].name == name)
			return true;
	}

	return false;
}

function craftUpgradedWeapon(itemInvSlot, upgradeLevel)
{
	let itemName = character.items[itemInvSlot].name;
	let item = item_properties(character.items[itemInvSlot]);

	if(item.level < upgradeLevel)
	{
		log("Upgrading " + itemName + "...");
		upgrade(itemInvSlot, locate_item("scroll0"));
	}
	else
	{
		let lastEmpty = -1;
		let emptySlots = 0;
		for(let i=0; i<character.items.length; i++)
		{
			if(item_properties(character.items[i]) == null)
			{
				lastEmpty = i;
				emptySlots++;
			}
		}

		if(lastEmpty != -1)
		{
			log("Moving +"+upgradeLevel + " " + itemName + " to last empty item slot");
			swap(itemInvSlot, lastEmpty);
		}

		if(emptySlots > 0)
		{
			log("Buying another " + itemName);
			buy_with_gold(itemName);
		}
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
	if(returningToTown)
		return;

	log("Merchant returning to town.");

	returningToTown = true;

	if(character.map == "main")
	{
		setTimeout(function()
		{
			use("use_town");
		}, delay);
	}
	else
	{
		setTimeout(function()
		{
			use("use_town");

            setTimeout(function()
            {
                goTo("main",{x:merchantStand_X,y:merchantStand_Y});
            }, 7500);

		}, delay);
	}
}

function buyPotionsFor(name, healthPots, manaPots)
{
	if(!isInTown())
	{
		returnToTown();
		return;
	}

	let request = deliveryRequests.find(x=>x.sender == name && x.request == "potions");
	if(!request)
	{
		log("Attempting to buy potions but don't have request");
		return;
	}
	else if(request.shipment)
	{
		log("Already fulfilled potion request.");
		return;
	}

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

	let potionShipment = {name:name, hPots:healthPots, mPots:manaPots};
	potionShipments.push(potionShipment);
	request.shipment = potionShipment;
	request.fulfilled = true;
}

function deliverPotions()
{
	if(potionShipments == null || potionShipments == [])
	{
		log("deliverPotions called but shopping list is empty!");
		return;
	}

	parent.party_list.forEach(function(otherPlayerName)
	{
		let partyMember = parent.entities[otherPlayerName];

		if(partyMember)
		{
			for(let i = 0; i < potionShipments.length; i++)
			{
				if(partyMember.name == potionShipments[i].name)
				{
					send_item(partyMember,locate_item("hpot0"), potionShipments[i].hPots);
					send_item(partyMember,locate_item("mpot0"), potionShipments[i].mPots);
					potionShipments.splice(i);
				}
			}
		}
	});
}

function enableVendorMode()
{
	if(!isInTown() || returningToTown || deliveryMode)
	{
		return;
	}

	log("Merchant returning to vendor mode.");

	if(!isInTown())
	{
		returnToTown();
	}
	else
	{
		smart_move({x: merchantStand_X, y: merchantStand_Y}, function()
		{
			log("Merchant entered vendor mode.");
			parent.open_merchant(locate_item("stand0"));
			vendorMode = true;
			returningToTown = false;
		});
	}
}

function disableVendorMode()
{
	log("Merchant exited vendor mode.");

	parent.close_merchant();
	vendorMode = false;
}