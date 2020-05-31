///		Merchant Settings		///
const lowScrolls = 1;
const scrollsToStock = 20;
const merchantItems = ["stand0","scroll0","scroll1","cscroll0","cscroll1","seashell"];
//////

var vendorMode = false;			//	true when in town with shop, false when busy delivering items
var deliveryMode = false;		//	true when the merchant has requests it needs to fulfill
var exchangeMode = false;		//	true when the merchant is busy exchanging items with an npc
var potionShipments = [];
var deliveryRequests = [];

function merchantOnStart()
{
	enableVendorMode();
}

function merchantAuto(target)
{
	//	keep magic luck on yourself
	if(!checkMluck(character))
	{
		log("mlucking self");
		use_skill("mluck", character);
		reduce_cooldown("mluck", character.ping);
	}

	for(other in parent.entities)
	{
		let isPartyMember = parent.party_list.includes(other);
		let target = parent.entities[other];

		if(!target.player || target.npc)
		{
			continue;
		}

		if(isPartyMember)
		{
			if(is_in_range(target, "mluck"))
			{
				if(checkPotionShipments(target.name))
				{
					deliverPotions(target.name);
				}
				else if(!checkMluck(target) && !is_on_cooldown("mluck"))
				{
					log("Giving mluck to " + target.name);
					use_skill("mluck", target);
					reduce_cooldown("mluck", character.ping);
				}
			}
			else if(deliveryMode && !returningToTown)
			{
				log("Moving closer");
				approachTarget(target);
			}
		}
		else if(target)
		{
			//	mluck others but some safety checks to make sure you don't spam it
			if(!checkMluck(target) && is_in_range(target, "mluck") && !is_on_cooldown("mluck") && !target.afk && !target.stand && character.mp > character.max_mp*0.5)
			{
				log("Giving mluck to " + target.name);
				use_skill("mluck", target);
				reduce_cooldown("mluck", character.ping);
			}
		}
	}
}

function merchantLateUpdate()
{
	checkRequests();

	if(!autoPlay || returningToTown || deliveryMode || banking || exchangeMode)
	{
		return;
	}

	if(checkForLowInventorySpace() && !banking && autoPlay && !returningToTown && !deliveryMode && autoPlay)
	{
		disableVendorMode();
		depositInventoryAtBank();
		return;
	}

	if(vendorMode && !deliveryMode && craftingOn && character.gold > minimumGold && isInTown())
	{
		stockScrolls();
		sellVendorTrash();
		buyBasicItems();
		buyFromPonty();
		craftUpgrades();
		craftCompounds();
		exchangeWithXyn();
		exchangeSeashells();
	}

	if(autoPlay && !vendorMode && !returningToTown && !deliveryMode && !banking && !exchangeMode)
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
		deliveryRequests.push({request:"potions",sender:sender,shipment:null,hPots:data.hPots,mPots:data.mPots});
	}
	else if(data.message == "mluck")
	{
		if(deliveryRequests.find(x=>x.request=="mluck"))
		{
			log("Already have mluck request.");
			return;
		}

		log("Recieved mluck request from " + sender);
		deliveryRequests.push({request:"mluck",from:sender});
	}
	else if(data.message == "thanks")
	{
		log("Recieved delivery confirmation from " + sender);

		if(data.request == "mluck")
		{
			let mluks = []
			for(let i = deliveryRequests.length-1; i >= 0; i--)
			{
				if(deliveryRequests[i].request=="mluck")
				{
					mluks.push(i);
				}
			}

			deliveryRequests.splice(mluks);
		}
		else
		{
			deliveryRequests.splice(deliveryRequests.indexOf(x=>x.sender == sender && x.request == request));
		}
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
	if(banking)
	{
		return;
	}

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
					approachTarget(recipient);
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

function craftUpgrades()
{
	for(let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if(item && itemsToUpgrade.includes(item.name) && item.level < upgradeLevelToStop)
		{
			log("Upgrading " + G.items[item.name].name + "...");

			let scroll = "scroll0";
			if(item.level >= upgradeLevelToUseTierTwoScroll || item.level >= G.items[item.name].grades[0])
			{
				scroll = "scroll1";
			}

			upgrade(i, locate_item(scroll));

			return true;
		}
	}

	return false;
}

function craftCompounds()
{
	for(let i = 0; i < compoundLevelToStop; i++)
	{
		if(craftCompound(i))
		{
			break;
		}
	}
}

function craftCompound(levelToUse)
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

function buyBasicItems()
{
	let count = 0;

	//	only buy if we are out of basic items in inventory to upgrade
	for(let i = 0; i < basicItemsToCraft.length; i++)
	{
		for(let k = 0; k < character.items.length; k++)
		{
			if(character.items[k] && (character.items[k].name == basicItemsToCraft[i] && character.items[k].level < upgradeLevelToStop))
			{
				count++;
			}
		}
	}

	if(count == 0)
	{
		for(let i = 0; i < basicItemsToCraft.length; i++)
		{
			log("Buying a " + G.items[basicItemsToCraft[i]].name);
			buy_with_gold(basicItemsToCraft[i]);
		}
	}
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

	buy_with_gold("hpot0", healthPots);
	log("Buying " + healthPots + " health potions");
	buy_with_gold("mpot0", manaPots);
	log("Buying " + manaPots + " mana potions");

	let potionShipment = {name:name, hPots:healthPots, mPots:manaPots};
	potionShipments.push(potionShipment);
	request.shipment = potionShipment;
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
	if(returningToTown || deliveryMode || banking)
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

function standCheck()
{
    if(is_moving(character) || smart.moving || returningToTown)
    {
		if(character.stand)
		{
			parent.close_merchant();
		}
	}
	else if(vendorMode)
	{
		parent.open_merchant(locate_item("stand0"));
	}
}

function buyFromPonty()
{
	let itemsToBuy = buyFromPontyList;

	parent.socket.once("secondhands", function(data)
	{
		for(let pontyItem of data)
		{
			if (itemsToBuy.includes(pontyItem.name))
			{
				let buy = false;

				if(itemsToUpgrade.includes(pontyItem.name) || itemsToCompound.includes(pontyItem.name))
				{
					if(itemsToUpgrade.includes(pontyItem.name) && (pontyItem.level <= upgradeLevelToStop))
					{
						buy = true;
					}
					else if(itemsToCompound.includes(pontyItem.name) && (pontyItem.level <= compoundLevelToStop))
					{
						buy = true;
					}
				}
				else
				{
					buy = true;
				}

				if(buy)
				{
					log("Buying " + pontyItem.name + " from Ponty!");
					parent.socket.emit("sbuy", { "rid": pontyItem.rid })
				}
            }
        }
    });

	parent.socket.emit("secondhands");
}

function exchangeItems(npcName, itemName, numberOfExchanges, onComplete)
{
	disableVendorMode();
	exchangeMode = true;

	smart_move(npcName, ()=>
	{
		for(let i = 0; i < numberOfExchanges; i++)
		{
			let count = i;

			setTimeout((x=count)=>
			{
				exchange(locate_item(itemName));

				if(x == numberOfExchanges-1)
				{
					exchangeMode = false;

					if(onComplete)
					{
						onComplete();
					}
				}

			}, 5000*(i));
		}
	});
}

function exchangeSeashells()
{
	let seashells = character.items[locate_item("seashell")];

	if(!seashells || seashells.q < 20)
	{
		return;
	}

	log("Exchanging seashells...");

	let exchanges = Math.floor(seashells.q/20);
	exchangeItems("fisherman", "seashell", exchanges);
}

function exchangeWithXyn()
{
	let xynTypes = ["gem","box"];

	for(let itemType of xynTypes)
	{
		for(let i = 0; i < character.items.length; i++)
		{
			let item = character.items[i];

			if(item && G.items[item.name].type == itemType)
			{
				log("Exchanging " + item.name + " with Xyn.. ");
				exchangeItems("exchange", item.name, 1, ()=>{exchangeWithXyn();});
				return;
			}
		}
	}
}