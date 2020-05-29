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
				if(checkPotionShipments(target.name))
				{
					deliverPotions(target.name);
				}
				else if(!checkMluck(target))
				{
					log("Giving mluck to " + target.name);
					use_skill("mluck", target);
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

	if(vendorMode && !deliveryMode && craftingOn && character.gold > minimumGold && isInTown())
	{
		sellVendorTrash();
		buyFromPonty(buyFromPontyList)

		let busy = false;

		for(let i = 0; i < compoundLevelToStop; i++)
		{
			busy = craftCompounds(i);

			if(busy)
			{
				break;
			}
		}

		for(let i = 0; i < itemsToUpgrade.length; i++)
		{
			busy = craftUpgrade(itemsToUpgrade[i], upgradeLevelToStop, upgradingBuyableItem[i]);

			if(busy)
			{
				break;
			}
		}
	}
}

function merchant_on_cm(sender, data)
{
	if(data.message == "buyPots")
	{
		if(deliveryRequests.find(x=>x.request=="potions" && x.sender==sender))
		{
			log("Already have potion request from " + sender);
			return;
		}

		log("Recieved potion request from " + sender);
		deliveryRequests.push({request:"potions",sender:sender,fulfilled:false,shipment:null,hPots:data.hPots,mPots:data.mPots});
	}
	else if(data.message == "mluck")
	{
		if(deliveryRequests.find(x=>x.request=="mluck" && x.sender==sender))
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
			//	go buy potions
			if(deliveryRequests[i].request == "potions" && !deliveryRequests[i].shipment)
			{
				buyPotionsFor(deliveryRequests[i].sender, deliveryRequests[i].hPots, deliveryRequests[i].mPots);
			}
			//	deliver potions or mluck
			else if(deliveryRequests[i].shipment || deliveryRequests[i].request == "mluck")
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
		{
			return true;
		}
	}

	return false;
}

function craftUpgrade(itemToUpgrade, upgradeLevel, buyable)
{
	let item = character.items[locate_item(itemToUpgrade)];

	if((!item && buyable) || (item && item.level >= upgradeLevel))
	{
		//let lastEmpty = -1;
		//let emptySlots = ;
		/*for(let i=0; i<character.items.length; i++)
		{
			if(item_properties(character.items[i]) == null)
			{
				lastEmpty = i;
				emptySlots++;
			}
		}*/

		for(let i=character.items.length-1; i>0; i--)
		{
			if(locate_item(character.items[i]) == null || character.items[i] != itemToUpgrade)
			{
				swap(locate_item(itemToUpgrade), i);
				break;
				//lastEmpty = i;
				//emptySlots++;
			}
		}

		/*
		if(lastEmpty != -1 && item)
		{
			log("Moving +"+item.level + " " + G.items[item.name].name + " to last empty item slot");
			swap(locate_item(itemToUpgrade), lastEmpty);
		}

		if(buyable)
		{
			log("Buying another " + G.items[itemToUpgrade].name);
			buy_with_gold(itemToUpgrade);
		}
		else
		{
			log("Inventory full, crafting mode disabling.");
			craftingOn = false;
		}*/

		return false;
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

		return true;
	}

	return false;
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
		return false;
	}

	log("Compounding three +" + levelToUse + " " + G.items[foundItem].name + "...");

	let scroll = "cscroll0";
	compound(triple[0], triple[1], triple[2], locate_item(scroll));

	return true;
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

function deliverPotions(nameToDeliverTo)
{
	log("Delivering potions");

	if(potionShipments == null || potionShipments == [])
	{
		log("deliverPotions called but shipments is empty!");
		return;
	}

	if(parent.entities[nameToDeliverTo])
	{
		let shipment = potionShipments.find(x=>x.name==nameToDeliverTo);

		log("Giving potions to " + nameToDeliverTo);

		send_item(nameToDeliverTo,locate_item("hpot0"), shipment.hPots);
		send_item(nameToDeliverTo,locate_item("mpot0"), shipment.mPots);
		potionShipments.splice(potionShipments.indexOf(shipment));
	}
}

function enableVendorMode()
{
	if(returningToTown || deliveryMode)
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