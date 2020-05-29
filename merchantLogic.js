var lowScrolls = 0;
var scrollsToStock = 10;
var vendorMode = false;			//	true when in town with shop, false when busy delivering items
var deliveryMode = false;		//	true when the merchant has requests it needs to fulfill
var potionShipments = [];
var deliveryRequests = [];

const scrolls = ["scroll0","scroll1","cscroll0"];

function merchantAuto(target)
{
	if(!checkMluck(character))
	{
		log("mlucking self");
		use_skill("mluck", character);
	}

	for(other in parent.entities)
	{
		let isPartyMember = parent.party_list.includes(other);
		let target = parent.entities[other];

		if(!target.player || target.npc)
			continue;

		if(isPartyMember)
		{
			if(is_in_range(target, "mluck"))
			{
				if(!checkMluck(target))
				{
					log("Giving mluck to " + target.name);
					use_skill("mluck", target);
				}
				else if(checkPotionShipments(target.name))
				{
					deliverPotions();
				}
			}
			else if(deliveryMode && !returningToTown)
			{
				log("Moving closer");

				smart_move(
					character.x + (target.x - character.x) * 0.3,
					character.y + (target.y - character.y) * 0.3
				);
			}
		}
		else if(target)
		{
			if(!checkMluck(target) && is_in_range(target, "mluck"))
			{
				log("Giving mluck to " + target.name);
				use_skill("mluck", target);
			}
		}
	}
}

function merchantLateUpdate()
{
	stockScrolls();
	checkRequests();
	if(isInTown())
	{
		sellVendorTrash();
	}

	if(!vendorMode && !returningToTown && !deliveryMode)
	{
		if(isInTown())
		{
			enableVendorMode();
		}
		else
		{
			returnToTown();
		}
	}

	if(vendorMode && craftingOn && character.gold > minimumGold)
	{
		buyFromPonty(buyFromPontyList)

		for(let i = 0; i < compoundLevelToStop; i++)
		{
			craftCompounds(i);
		}

		for(let i = 0; i < itemsToUpgrade.length; i++)
		{
			craftUpgrade(itemsToUpgrade[i], upgradeLevelToStop, upgradingBuyableItem[i]);
		}
	}
}

function merchant_on_cm(sender, data)
{
	if(data.message == "buyPots")
	{
		if(checkPotionShipments(sender))
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

//	returns true if mluck is present & from your own merchant. target should be a player object, not a name
function checkMluck(target)
{
	if(!target.s.mluck || target.s.mluck.f != merchantName)
	{
		return false;
	}
	else
	{
		return true;
	}
}

function sellVendorTrash()
{
	for(let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if(item && vendorTrash.find(x=>x==item.name))
		{
			log("Selling " + item.name + " to vendor.");
			sell(i, item.q);
		}
	}
}

function checkRequests()
{
	if(deliveryRequests.length > 0)
	{
		deliveryMode = true;
		disableVendorMode();

		for(let i = 0; i < deliveryRequests.length; i++)
		{
			//	deliver potions or mluck
			if(deliveryRequests[i].shipment || deliveryRequests[i].request == "mluck")
			{
				let recipient = parent.entities[deliveryRequests[i].sender];
				if(recipient)
				{
					smart_move(
						character.x + (recipient.x - character.x) * 0.3,
						character.y + (recipient.y - character.y) * 0.3
					);
				}
				else
				{
					requestMagiPort();
				}
			}
			//	go buy potions
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

//	returns true if holding a shipment for delivery to the given name
function checkPotionShipments(name)
{
	if(potionShipments.length == 0)
	{
		return false;
	}

	for(let i = 0; i < potionShipments.length; i++)
	{
		if(potionShipments[i].name == name)
			return true;
	}

	return false;
}

function craftUpgrade(itemToUpgrade, upgradeLevel, buyable)
{
	let item = character.items[locate_item(itemToUpgrade)];

	if((!item && buyable) || (item && item.level >= upgradeLevel))
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

		if(lastEmpty != -1 && item)
		{
			log("Moving +"+item.level + " " + G.items[item.name].name + " to last empty item slot");
			swap(itemInvSlot, lastEmpty);
		}

		if(emptySlots && buyable)
		{
			log("Buying another " + G.items[itemToUpgrade].name);
			buy_with_gold(itemToUpgrade);
		}
		else
		{
			log("Inventory full, crafting mode disabling.");
			craftingOn = false;
		}
	}
	else if(item && item.level < upgradeLevel)
	{
		log("Upgrading " + G.items[item.name].name + "...");

		let scroll = "scroll0";
		if(item.level >= 7)
		{
			scroll = "scroll1";
		}

		upgrade(locate_item(itemToUpgrade), locate_item(scroll));
	}
}

function craftCompounds(levelToUse)
{
	let triple = [-1,-1,-1];
	let foundItem = "";

	for(let i = 0; i < itemsToCompound.length; i++)
	{
		let count = 0;
		triple = [-1,-1,-1];

		for(let k = 0; k < character.items.length; k++)
		{
			let item = character.items[k];
			if(item  && item.name == itemsToCompound[i] && item.level == levelToUse && count < 3)
			{
				triple[count] = k;
				count++;
			}
		}

		//	found a triple, stop looking
		if(triple[0] != -1 && triple[1] != -1 && triple[2] != -1)
		{
			foundItem = itemsToCompound[i];
			break;
		}
	}

	//	no triple
	if(foundItem == "")
	{
		return;
	}

	log("Compounding three +" + levelToUse + " " + G.items[foundItem].name + "...");

	let scroll = "cscroll0";
	compound(triple[0], triple[1], triple[2], locate_item(scroll));
}

function stockScrolls()
{
	for(let i = 0; i < scrolls.length; i++)
	{
		let s = scrolls[i];
		let amount = quantity(s);
		if(amount <= lowScrolls)
		{
			buy_with_gold(s, scrollsToStock);
			log("Buying " + scrollsToStock + " " + G.items[s].name);
		}
	}
}

function buyPotionsFor(name, healthPots, manaPots)
{
	let request = deliveryRequests.find((x)=>
	{
		if(x.sender == name && x.request == "potions")
		{
			return x;
		}
	});

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

	if(!isInTown())
	{
		log("Returning to buy potions...");
		returnToTown();
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
	log("Delivering potions");

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
					let has_hPots = character.items[locate_item("hpot0")].q >= potionShipments[i].hPots;
					let has_mPots = character.items[locate_item("mpot0")].q >= potionShipments[i].mPots;

					if(!(has_hPots && has_mPots))
					{
						log("Tried to deliver potions but don't have shipment, returning to town.");
						returnToTown();
						return;
					}

					log("Giving potions to " + otherPlayerName);

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
		smart_move(merchantStandCoords, function()
		{
			log("Merchant entered vendor mode.");
			log("Crafting Mode: " + craftingOn);
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

function dontWalkWithShop()
{
	if(character.stand)
	{
		parent.close_merchant();
	}
}

function buyFromPonty(itemsToBuy)
{
	parent.socket.once("secondhands", function(data)
	{
		for(let d of data)
		{
			if (itemsToBuy.includes(d.name))
			{
				let buy = false;

				if(itemsToUpgrade.includes(d.name) && (!d.level || d.level <= upgradeLevelToStop))
				{
					buy = true;
				}
				else if(itemsToCompound.includes(d.name) && (!d.level || d.level <= compoundLevelToStop))
				{
					buy = true;
				}
				else if(!itemsToUpgrade.includes(d.name) && !itemsToCompound.includes(d.name))
				{
					buy = true;
				}

				if(buy)
				{
					log("Buying " + d.name + " from Ponty!");
					parent.socket.emit("sbuy", { "rid": d.rid })
				}
            }
        }
    });

	parent.socket.emit("secondhands");
}