///		Merchant Settings		///
const lowScrolls = 1;
const scrollsToStock = [100, 20, 0];
//////

var vendorMode = false;			//	true when in town with shop, false when busy delivering items
var deliveryMode = false;		//	true when the merchant has requests it needs to fulfill
var exchangeMode = false;		//	true when the merchant is busy exchanging items with an npc
var deliveryShipments = [];
var deliveryRequests = [];

const mluckDuration = 3600000;

function merchantOnStart()
{
	pontyExclude.forEach(x=>{buyFromPontyList.splice(buyFromPontyList.indexOf(x), 1)});
	merchantItems.forEach(x=>{itemsToHoldOnTo.push(x)});
	enableVendorMode();
}

function merchantAuto(target)
{
	if(!isBusy())
	{
		sortMerchantInventory();
	}

	//	keep magic luck on yourself
	if(!checkMluck(character)&& !is_on_cooldown("mluck"))
	{
		log("mlucking self");
		use_skill("mluck", character);
		reduce_cooldown("mluck", character.ping);
	}

	for(other in parent.entities)
	{
		let isPartyMember = parent.party_list.includes(other);
		let friendlyTarget = parent.entities[other];

		if(!friendlyTarget.player || friendlyTarget.npc)
		{
			continue;
		}

		if(isPartyMember)
		{
			if(distance(friendlyTarget, character) < 200)
			{
				let shipment = getShipmentFor(friendlyTarget.name);

				if(shipment)
				{
					deliverItems(shipment);
				}
				else if(!checkMluck(friendlyTarget))
				{
					log("Giving mluck to " + friendlyTarget.name);
					use_skill("mluck", friendlyTarget);
					reduce_cooldown("mluck", character.ping);
				}
			}
			else if(deliveryMode && !returningToTown && deliveryRequests.length > 0)
			{
				log("Moving closer to recipient.");
				approachTarget(friendlyTarget);
			}
		}
		else if(friendlyTarget)
		{
			//	mluck others but some safety checks to make sure you don't spam it
			if(!is_on_cooldown("mluck") && !checkMluck(friendlyTarget) && is_in_range(friendlyTarget, "mluck") && !friendlyTarget.afk && !friendlyTarget.stand && character.mp > character.max_mp*0.5)
			{
				log("Giving mluck to " + friendlyTarget.name);
				use_skill("mluck", friendlyTarget);
				reduce_cooldown("mluck", character.ping);
			}
		}
	}
}

function merchantLateUpdate()
{
	checkRequests();
	confirmDeliveries();

	if(!autoPlay || isBusy())
	{
		return;
	}

	if(vendorMode && isInTown())
	{
		sellVendorTrash();
		exchangeWithXyn();
		exchangeSeashells();

		if(craftingOn)
		{
			craftCompounds();
			craftUpgrades();
		}

		if(character.gold > minimumGold)
		{
			stockScrolls();
			buyBasicItems();
			buyFromPonty();
		}
	}

	if(checkForLowInventorySpace())
	{
		if(!isInTown())
		{
			goBackToTown();
			return;
		}

		sellVendorTrash();

		if(checkForLowInventorySpace())
		{
			disableVendorMode();
			depositInventoryAtBank();
			return;
		}
	}

	if(autoPlay && !vendorMode && !isBusy())
	{
		if(isInTown())
		{
			enableVendorMode();
		}
		else
		{
			goBackToTown();
		}
	}
}

function merchant_on_cm(sender, data)
{
	if(data.message == "buyPots")
	{
		if(deliveryRequests.find((x)=>{if(x.request=="potions" && x.sender==sender) return x;}))
		{
			log("Already have potion request from " + sender);
			return;
		}

		log("Recieved potion request from " + sender);
		deliveryRequests.push({request:"potions",sender:sender,shipment:null,hPots:data.hPots,mPots:data.mPots});
	}
	else if(data.message == "elixir")
	{
		if(deliveryRequests.find((x)=>{if(x.request=="elixir" && x.sender==sender) return x;}))
		{
			log("Already have elixir request from " + sender);
			return;
		}

		log("Recieved elixir request from " + sender);

		let elixir = getElixirInventorySlot(data.type);

		if(elixir)
		{
			let shipmentItem = character.items[elixir];
			deliveryRequests.push({request:"elixir",sender:sender,shipment:shipmentItem.name,type:data.type});
			deliveryShipments.push({name:sender, elixir:shipmentItem.name, type:data.type});
		}
		else
		{
			log("Don't have any " + data.type + " elixirs.");
			send_cm(sender, {message:"noelixirs"});
		}
	}
	else if(data.message == "mluck")
	{
		if(deliveryRequests.find((x)=>{if(x.request=="mluck") return x;}))
		{
			log("Already have mluck request.");
			return;
		}

		log("Recieved mluck request from " + sender);
		deliveryRequests.push({request:"mluck",sender:sender});
	}
	else if(data.message == "thanks")
	{
		log("Successful delivery confirmation from " + sender);

		if(data.request == "mluck")
		{
			for(let i = deliveryRequests.length-1; i >= 0; i--)
			{
				if(deliveryRequests[i].request=="mluck")
				{
					deliveryRequests.splice(i, 1);
				}
			}
		}
		else
		{
			deliveryRequests.splice(deliveryRequests.indexOf(x=>x.sender == sender && x.request == request), 1);
		}
	}

	//	this should remain the last check
	if(data.message == "deliveryConfirmation")
	{
		if(!data.confirm)
		{
			return;
		}

		for(let i = deliveryRequests.length-1; i >= 0; i--)
		{
			if(deliveryRequests[i].sender == sender)
			{
				log("Cleaning up delivery list...");
				deliveryRequests.splice(i, 1);
			}
		}

		for(let i = deliveryShipments.length-1; i >= 0; i--)
		{
			if(deliveryShipments[i].name == sender)
			{
				log("Cleaning up delivery list...");
				deliveryShipments.splice(i, 1);
			}
		}
	}
}

function merchant_on_magiport(name)
{
	if(!deliveryMode || (returningToTown || banking || exchangeMode))
	{
		return;
	}

	stop();
	accept_magiport(name);
}

//	returns true if the merchant is occupied with a task
function isBusy()
{
	let busy = returningToTown || deliveryMode || banking || exchangeMode || character.q.upgrade || character.q.compound;
	return busy;
}

//	returns true if mluck is present & from your own merchant. target should be a player object, not a name
function checkMluck(target)
{
	let mluck = (target.s.mluck && target.s.mluck.f == merchantName) || (target.s.mluck && target.s.mluck.ms < mluckDuration*0.5);
	return mluck;
}

function sellVendorTrash()
{
	for(let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if(item && vendorTrash.includes(item.name) && !isShiny(item))
		{
			log("Selling " + item.name + " to vendor.");
			sell(i, item.q);
		}
	}
}

function checkRequests()
{
	if(deliveryRequests.length == 0)
	{
		deliveryMode = false;
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
			//	deliver to recipient
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
}

//	returns null if no shipment
function getShipmentFor(name)
{
	if(deliveryShipments.length == 0)
	{
		return null;
	}

	for(let i = 0; i < deliveryShipments.length; i++)
	{
		if(deliveryShipments[i].name == name)
		{
			return deliveryShipments[i];
		}
	}

	return null;
}

function craftUpgrades()
{
	for(let i = 1; i <= upgradeLevelToStop; i++)
	{
		if(craftUpgrade(i))
		{
			break;
		}
	}
}

function craftUpgrade(targetUpgradeLevel)
{
	for(let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if(item && itemsToUpgrade.includes(item.name) && item.level < targetUpgradeLevel && !isShiny(item))
		{
			log("Upgrading " + G.items[item.name].name + "...");

			let scroll = "scroll0";
			if(item.level >= upgradeLevelToUseTierTwoScroll || item.level >= G.items[item.name].grades[0])
			{
				scroll = "scroll1";
			}

			let scrollToUse = locate_item(scroll);

			if(scrollToUse > -1)
			{
				upgrade(i, scrollToUse);
				return true;
			}
			else
			{
				log("Missing " + G.items[scroll].name);
			}
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
			if(item  && item.name == itemsToCompound[i] && item.level == levelToUse && count < 3 && !isShiny(item))
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

	let scroll = "cscroll0";
	let scrollToUse = locate_item(scroll);

	if(scrollToUse > -1)
	{
		log("Compounding three +" + levelToUse + " " + G.items[foundItem].name + "...");
		compound(triple[0], triple[1], triple[2], scrollToUse);
		return true;
	}
	else
	{
		log("Missing " + G.items[scroll].name);
	}

	return true;
}

function buyBasicItems()
{
	let count = 0;

	if(count == 0)
	{
		for(let i = 0; i < basicItemsToCraft.length; i++)
		{
			if(!G.items[basicItemsToCraft[i]])
			{
				log(basicItemsToCraft[i] + " is not a valid item name!");
				return;
			}

			if(character.items.find((x)=>{if(x && x.name == basicItemsToCraft[i] && x.level < upgradeLevelToStop) return x;}))
			{
				continue;
			}

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
			let q = 0;
			if(s.includes(0))
			{
				q = scrollsToStock[0];
			}
			else if(s.includes(1))
			{
				q = scrollsToStock[1];
			}
			else if(s.includes(2))
			{
				q = scrollsToStock[2];
			}

			buy_with_gold(s, q);
			log("Buying " + q + " grade " + (G.items[s].grade) + " " + G.items[s].name);
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

	if(getEmptyInventorySlotCount() < 8)
	{
		sellVendorTrash();

		if(getEmptyInventorySlotCount() < 8 && (!hasUpgradableItems() && craftingOn))
		{
			log("Need inventory space to buy potions, going to bank.");
			disableVendorMode();
			depositInventoryAtBank();
			return;
		}
		else
		{
			log("Continuing to craft in order to free inventory space.");
		}
	}

	if(!isInTown())
	{
		log("Returning to buy potions...");
		goBackToTown();
		return;
	}

	let h = healthPots - quantity(potions[0]);
	let m = manaPots - quantity(potions[1]);

	if(h > 0)
	{
		buy_with_gold(potions[0], h);
		log("Buying " + healthPots + " health potions");
	}

	if(m > 0)
	{
		buy_with_gold(potions[1], m);
		log("Buying " + manaPots + " mana potions");
	}

	let potionShipment = {name:name, hPots:healthPots, mPots:manaPots};
	deliveryShipments.push(potionShipment);
	request.shipment = potionShipment;
}

function deliverItems(shipmentToDeliver)
{
	if(shipmentToDeliver.hPots != null || shipmentToDeliver.mPots != null)
	{
		deliverPotions(shipmentToDeliver);
	}
	else if(shipmentToDeliver.elixir != null)
	{
		deliverElixir(shipmentToDeliver);
	}
}

function deliverElixir(shipment)
{
	let recipient = parent.entities[shipment.name];
	if(distance(recipient, character) < 200)
	{
		log("Delivering elixir to " + shipment.name);
		let elixir = getElixirInventorySlot(shipment.type);
		let index = deliveryShipments.indexOf(shipment);
		deliveryShipments.splice(index, 1);
		send_item(shipment.name, elixir, 1);
	}
	else
	{
		approachTarget(recipient);
	}
}

function deliverPotions(shipment)
{
	let recipient = parent.entities[shipment.name];
	if(distance(recipient, character) < 200)
	{
		log("Delivering potions to " + shipment.name);
		let index = deliveryShipments.indexOf(shipment);
		deliveryShipments.splice(index, 1);
		send_item(shipment.name,locate_item(potions[0]), shipment.hPots);
		send_item(shipment.name,locate_item(potions[1]), shipment.mPots);
	}
	else
	{
		approachTarget(recipient);
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
		goBackToTown();
	}
	else
	{
		smart_move(merchantStandCoords, ()=>
		{
			log("Merchant entered vendor mode.");
			log("Crafting Mode: " + craftingOn);
			parent.open_merchant(locate_item("stand0"));
			vendorMode = true;
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
			if(pontyItem.p)
			{
				show_json("Found shiny ponty item : " + G.items[pontyItem.name].name);
			}

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
					log("Buying " + G.items[pontyItem.name].name + " from Ponty!");
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

			}, 10000*(i));
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
	if(isBusy())
	{
		return;
	}

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

//	keeps the merchant's inventory bottom row in a set order for organization
function sortMerchantInventory()
{
	return;

	for(let m = 0; m < merchantItems.length; m++)
	{
		for(let i = character.items.length-1; i >= 0; i--)
		{
			let item = character.items[i];

			if(!item || (item && item.name != merchantItems[m]))
			{
				let correctItem = locate_item(merchantItems[m]);

				if(correctItem > -1)
				{
					swap(i, correctItem);
					break;
				}
			}
		}
	}
}

//	don't like that this feels necessary, but this should clean up requests not being cleaned up properly even when they are successfully completed (leading to the merchant gettings stuck)
function confirmDeliveries()
{
	if(deliveryRequests.length == 0 && deliveryShipments.length == 0)
	{
		return true;
	}

	for(let r of deliveryRequests)
	{
		send_cm(r.sender, {message:"confirmDelivery"});
	}

	for(let r of deliveryShipments)
	{
		if(!deliveryRequests.find((x)=>{if(x.sender == r.name) return x;}))
		{
			send_cm(r.sender, {message:"confirmDelivery"});
		}
	}
}