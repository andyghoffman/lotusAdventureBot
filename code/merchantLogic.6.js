///		Merchant Settings		///
const LowScrolls = 1;
const ScrollsToStock = [100, 20, 0];
//////

let VendorMode = false;			//	true when in town with shop, false when busy delivering items
let DeliveryMode = false;		//	true when the merchant has requests it needs to fulfill
let ExchangeMode = false;		//	true when the merchant is busy exchanging items with an npc
const DeliveryShipments = [];
const DeliveryRequests = [];

const MLuckDuration = 3600000;

function merchantOnStart()
{
	PontyExclude.forEach(x => { BuyFromPonty.splice(BuyFromPonty.indexOf(x), 1) });
	MerchantItems.forEach(x => { ItemsToHoldOnTo.push(x) });
	enableVendorMode();
}

function merchantAuto(target)
{
	standCheck();
	
	//	keep magic luck on yourself
	if (!checkMluck(character) && !is_on_cooldown("mluck"))
	{
		use_skill("mluck", character);
		reduce_cooldown("mluck", character.ping);
	}

	for(let p in parent.entities)
	{
		let isPartyMember = WhiteList.includes(p);
		let friendlyTarget = parent.entities[p];

		if (!friendlyTarget.player || friendlyTarget.npc)
		{
			continue;
		}

		if (isPartyMember && friendlyTarget)
		{
			if (distance(friendlyTarget, character) < 100)
			{
				let shipment = getShipmentFor(friendlyTarget.name);

				if (shipment)
				{
					deliverItems(shipment);
				}
				else if (!checkMluck(friendlyTarget))
				{
					log("Giving mluck to " + friendlyTarget.name);
					use_skill("mluck", friendlyTarget);
					reduce_cooldown("mluck", character.ping);
				}
			}
			else if (DeliveryMode && !smart.moving && !GoingBackToTown && DeliveryRequests.length > 0 && friendlyTarget.name === DeliveryRequests[0].sender)
			{
				log("Moving closer to recipient.");
				approachTarget(friendlyTarget);
				//smart_move({x:friendlyTarget.x, y:friendlyTarget.y});
			}
		}
		else if (friendlyTarget)
		{
			//	mluck others but some safety checks to make sure you don't spam it
			if (!is_on_cooldown("mluck") && !checkMluck(friendlyTarget) && is_in_range(friendlyTarget, "mluck") && !friendlyTarget.afk && !friendlyTarget.stand && character.mp > character.max_mp * 0.5)
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
	if (character.rip || character.q.upgrade || character.q.compound)
	{
		return;
	}

	checkSentRequests();
	checkRequests();
	confirmDeliveries();

	if (!AutoPlay || isBusy())
	{
		return;
	}

	if (VendorMode && isInTown())
	{
		sellVendorTrash();
		exchangeWithXyn();
		exchangeSeashells();
		exchangeLeather();

		if (CraftingOn)
		{
			craftCompounds();
			craftUpgrades();
		}

		if (character.gold > MinimumGold)
		{
			stockScrolls();
			buyBasicItems();
			buyFromPonty();
		}
	}

	if (checkForLowInventorySpace())
	{
		if (!isInTown())
		{
			goBackToTown();
			return;
		}

		sellVendorTrash();

		if (checkForLowInventorySpace())
		{
			disableVendorMode();
			depositInventoryAtBank();
			return;
		}
	}

	if (!isBusy() && AutoPlay)
	{
		if (isInTown() && !VendorMode)
		{
			enableVendorMode();
		}
		else if (!isInTown())
		{
			goBackToTown();
		}
	}
}

function merchant_on_cm(sender, data)
{
	switch (data.message)
	{
		case "buyPots":
			if (DeliveryRequests.find((x) =>
			{
				if (x.request === "potions" && x.sender === sender) return x;
			}))
			{
				log("Already have potion request from " + sender);
				return;
			}

			log("Recieved potion request from " + sender);
			DeliveryRequests.push({
				request: "potions",
				sender: sender,
				shipment: null,
				hPots: data.hPots,
				mPots: data.mPots
			});
			return;
		case "elixir":
			if (DeliveryRequests.find((x) => { if (x.request === "elixir" && x.sender === sender) return x; }))
			{
				log("Already have elixir request from " + sender);
				return;
			}
			log("Recieved elixir request from " + sender);
			let elixir = getElixirInventorySlot(data.type);
			if (elixir)
			{
				let shipmentItem = character.items[elixir];
				DeliveryRequests.push({
					request: "elixir",
					sender: sender,
					shipment: shipmentItem.name,
					type: data.type
				});
				DeliveryShipments.push({name: sender, elixir: shipmentItem.name, type: data.type});
			} else
			{
				log("Don't have any " + data.type + " elixirs.");
				send_cm(sender, {message: "noelixirs"});
			}
			return;
		case "mluck":
			if (DeliveryRequests.find((x) => { if (x.request == "mluck") return x;}))
			{
				log("Already have mluck request.");
				return;
			}
			log("Recieved mluck request from " + sender);
			DeliveryRequests.push({request: "mluck", sender: sender});
			return;
		case "thanks":
			log("Successful delivery confirmation from " + sender);
			if (data.request === "mluck")
			{
				for (let i = DeliveryRequests.length - 1; i >= 0; i--)
				{
					if (DeliveryRequests[i].request === "mluck")
					{
						DeliveryRequests.splice(i, 1);
					}
				}
			} else
			{
				DeliveryRequests.splice(DeliveryRequests.indexOf(x => x.sender === sender && x.request === data.request), 1);
			}
			return;
		case "deliveryConfirmation":
			if (!data.confirm)
			{
				return;
			}
			for (let i = DeliveryRequests.length - 1; i >= 0; i--)
			{
				if (DeliveryRequests[i].sender === sender)
				{
					log("Cleaning up delivery list...");
					DeliveryRequests.splice(i, 1);
				}
			}
			for (let i = DeliveryShipments.length - 1; i >= 0; i--)
			{
				if (DeliveryShipments[i].name === sender)
				{
					log("Cleaning up delivery list...");
					DeliveryShipments.splice(i, 1);
				}
			}
			break;
		case "magiportRequestResponse":
			if (data.available)
			{
				requestMagiPort();
			}
			else if(!Traveling)
			{
				goTo(data.map, data.coords);
			}
	}
}

function merchant_on_magiport(name)
{
	if (!DeliveryMode)
	{
		return;
	}

	stop();
	accept_magiport(name);
}

//	returns true if the merchant is occupied with a task
function isBusy()
{
	return GoingBackToTown || DeliveryMode || Banking || ExchangeMode || character.q.upgrade || character.q.compound;
}

//	returns true if mluck is present & from your own merchant. target should be a player object, not a name
function checkMluck(target)
{
	return (target.s.mluck && target.s.mluck.f === MerchantName) || (target.s.mluck && target.s.mluck.ms < MLuckDuration * 0.5);
}

function sellVendorTrash()
{
	for (let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if (item && VendorTrash.includes(item.name) && !isShiny(item))
		{
			log("Selling " + item.name + " to vendor.");
			sell(i, item.q);
		}
	}
}

function checkRequests()
{
	if (DeliveryRequests.length === 0)
	{
		DeliveryMode = false;
		return;
	}

	if (DeliveryRequests.length > 0)
	{
		DeliveryMode = true;
		
		if(VendorMode)
		{
			disableVendorMode();			
		}

		for (let i = 0; i < DeliveryRequests.length; i++)
		{
			//	go buy potions
			if (DeliveryRequests[i].request === "potions" && !DeliveryRequests[i].shipment)
			{
				buyPotionsFor(DeliveryRequests[i].sender, DeliveryRequests[i].hPots, DeliveryRequests[i].mPots);
				return;
			}
			//	deliver to recipient
			else if (DeliveryRequests[i].shipment || DeliveryRequests[i].request === "mluck")
			{
				let recipient = parent.entities[DeliveryRequests[i].sender];
				if (recipient)
				{
					//approachTarget(recipient);
				}
				else
				{
					send_cm(DeliveryRequests[i].sender, {message:"magiport?"});
					//requestMagiPort();
				}
				
				return;
			}
		}
	}
}

//	returns null if no shipment
function getShipmentFor(name)
{
	for (let i = 0; i < DeliveryShipments.length; i++)
	{
		if (DeliveryShipments[i].name === name)
		{
			return DeliveryShipments[i];
		}
	}

	return null;
}

function craftUpgrades()
{
	for (let i = 1; i <= UpgradeLevelToStop; i++)
	{
		if (craftUpgrade(i))
		{
			break;
		}
	}
}

function craftUpgrade(targetUpgradeLevel)
{
	for (let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if (item && ItemsToUpgrade.includes(item.name) && item.level < targetUpgradeLevel && !isShiny(item))
		{
			log("Upgrading " + G.items[item.name].name + "...");

			let scroll = "scroll0";
			if (item.level >= UpgradeLevelToUseTierTwoScroll || item.level >= G.items[item.name].grades[0])
			{
				scroll = "scroll1";
			}

			if ((item.level >= 7 && item.tier > 1) || (item.level >= 6 && item.tier >= 2))
			{
				buy_with_gold("scroll2");
				scroll = "scroll2";
			}
			
			let scrollToUse = locate_item(scroll);

			if (scrollToUse > -1)
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
	for (let i = 0; i < CompoundLevelToStop; i++)
	{
		if (craftCompound(i))
		{
			break;
		}
	}
}

function craftCompound(levelToUse)
{
	let triple = [-1, -1, -1];
	let foundItem = "";

	for (let i = 0; i < ItemsToCompound.length; i++)
	{
		let count = 0;
		triple = [-1, -1, -1];

		for (let k = 0; k < character.items.length; k++)
		{
			let item = character.items[k];
			if (item && item.name === ItemsToCompound[i] && item.level === levelToUse && count < 3 && !isShiny(item))
			{
				triple[count] = k;
				count++;
			}
		}

		//	found a triple, stop looking
		if (triple[0] !== -1 && triple[1] !== -1 && triple[2] !== -1)
		{
			foundItem = ItemsToCompound[i];
			break;
		}
	}

	//	no triple
	if (foundItem === "")
	{
		return false;
	}

	let item = triple[0];
	
	let scroll = "cscroll0";
	if (item.level >= CompoundLevelToUseTierTwoScroll || item.level >= G.items[foundItem].grades[0])
	{
		scroll = "cscroll1";
	}
	
	let scrollToUse = locate_item(scroll);

	if (scrollToUse > -1)
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
	for (let i = 0; i < BasicItemsToCraft.length; i++) 
	{
		if (!G.items[BasicItemsToCraft[i]]) 
		{
			log(BasicItemsToCraft[i] + " is not a valid item name!");
			return;
		}

		if (character.items.find((x) => { if (x && x.name === BasicItemsToCraft[i] && x.level < UpgradeLevelToStop) return x;})) 
		{
			continue;
		}

		log("Buying a " + G.items[BasicItemsToCraft[i]].name);
		buy_with_gold(BasicItemsToCraft[i]);
	}
}

function stockScrolls()
{
	for (let i = 0; i < Scrolls.length; i++)
	{
		let s = Scrolls[i];
		let amount = quantity(s);
		if (amount <= LowScrolls)
		{
			let q = 0;
			if (s.includes('0'))
			{
				q = ScrollsToStock[0];
			}
			else if (s.includes('1'))
			{
				q = ScrollsToStock[1];
			}
			else if (s.includes('2'))
			{
				q = ScrollsToStock[2];
			}

			buy_with_gold(s, q);
			log("Buying " + q + " grade " + (G.items[s].grade) + " " + G.items[s].name);
		}
	}
}

function buyPotionsFor(name, healthPots, manaPots)
{
	let request = DeliveryRequests.find((x) =>
	{
		if (x.sender === name && x.request === "potions")
		{
			return x;
		}
	});

	if (!request)
	{
		log("Attempting to buy potions but don't have request");
		return;
	}

	if (getEmptyInventorySlotCount() < VeryLowInventoryThreshold)
	{
		sellVendorTrash();

		if (getEmptyInventorySlotCount() < VeryLowInventoryThreshold)
		{
			log("Need inventory space to buy potions, going to bank.");
			disableVendorMode();
			depositInventoryAtBank();
			return;
		}
	}

	if (!isInTown())
	{
		log("Returning to buy potions...");
		goBackToTown();
		return;
	}

	let h = healthPots - quantity(Potions[0]);
	let m = manaPots - quantity(Potions[1]);

	if (h > 0)
	{
		buy_with_gold(Potions[0], h);
		log("Buying " + healthPots + " health potions");
	}

	if (m > 0)
	{
		buy_with_gold(Potions[1], m);
		log("Buying " + manaPots + " mana potions");
	}

	let potionShipment = { name: name, hPots: healthPots, mPots: manaPots };
	DeliveryShipments.push(potionShipment);
	request.shipment = potionShipment;
}

function deliverItems(shipmentToDeliver)
{
	if (shipmentToDeliver.hPots != null || shipmentToDeliver.mPots != null)
	{
		deliverPotions(shipmentToDeliver);
	}
	else if (shipmentToDeliver.elixir != null)
	{
		deliverElixir(shipmentToDeliver);
	}
}

function deliverElixir(shipment)
{
	let recipient = parent.entities[shipment.name];
	if (distance(recipient, character) < 200)
	{
		log("Delivering elixir to " + shipment.name);
		let elixir = getElixirInventorySlot(shipment.type);
		let index = DeliveryShipments.indexOf(shipment);
		DeliveryShipments.splice(index, 1);
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
	if (distance(recipient, character) < 200)
	{
		log("Delivering potions to " + shipment.name);
		let index = DeliveryShipments.indexOf(shipment);
		DeliveryShipments.splice(index, 1);
		send_item(shipment.name, locate_item(Potions[0]), shipment.hPots);
		send_item(shipment.name, locate_item(Potions[1]), shipment.mPots);
	}
	else
	{
		approachTarget(recipient);
	}
}

function enableVendorMode()
{
	if (GoingBackToTown || DeliveryMode || Banking)
	{
		return;
	}

	log("Merchant returning to vendor mode.");

	if (!isInTown())
	{
		goBackToTown();
	}
	else
	{
		smart_move(MerchantStandCoords, () =>
		{
			log("Merchant entered vendor mode.");
			log("Crafting Mode: " + CraftingOn);
			parent.open_merchant(locate_item("stand0"));
			VendorMode = true;
		});
	}
}

function disableVendorMode()
{
	log("Merchant exited vendor mode.");

	parent.close_merchant();
	VendorMode = false;
}

function standCheck()
{
	if (is_moving(character) || smart.moving || GoingBackToTown)
	{
		if (character.stand)
		{
			parent.close_merchant();
		}
	}
	else if (VendorMode)
	{
		parent.open_merchant(locate_item("stand0"));
	}
}

function buyFromPonty()
{
	let itemsToBuy = BuyFromPonty;

	parent.socket.once("secondhands", function (data)
	{
		for (let pontyItem of data)
		{
			let buy = false;

			if (pontyItem.p)
			{
				writeToLog("Found shiny ponty item : " + G.items[pontyItem.name].name);
				buy = true;
			}

			if (itemsToBuy.includes(pontyItem.name))
			{
				if (ItemsToUpgrade.includes(pontyItem.name) || ItemsToCompound.includes(pontyItem.name))
				{
					if (ItemsToUpgrade.includes(pontyItem.name) && (pontyItem.level <= UpgradeLevelToStop))
					{
						buy = true;
					}
					else if (ItemsToCompound.includes(pontyItem.name) && (pontyItem.level <= CompoundLevelToStop))
					{
						buy = true;
					}
				}
				else
				{
					buy = true;
				}

				if (buy)
				{
					writeToLog("Buying " + G.items[pontyItem.name].name + " from Ponty!");
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
	ExchangeMode = true;

	smart_move(npcName, () =>
	{
		for (let i = 0; i < numberOfExchanges; i++)
		{
			let count = i;

			setTimeout((x = count) =>
			{
				exchange(locate_item(itemName));

				if (x === numberOfExchanges - 1)
				{
					ExchangeMode = false;

					if (onComplete)
					{
						onComplete();
					}
				}

			}, 10000 * (i));
		}
	});
}

function exchangeSeashells()
{
	if (isBusy())
	{
		return;
	}

	let seashells = character.items[locate_item("seashell")];

	if (!seashells || seashells.q < 20)
	{
		return;
	}

	writeToLog("Exchanging seashells...");

	let exchanges = Math.floor(seashells.q / 20);
	exchangeItems("fisherman", "seashell", exchanges);
}

function exchangeLeather()
{
	if (isBusy())
	{
		return;
	}

	let leather = character.items[locate_item("leather")];

	if (!leather || leather.q < 40)
	{
		return;
	}

	writeToLog("Exchanging leather...");

	let exchanges = Math.floor(leather.q / 40);
	exchangeItems("leathermerchant", "leather", exchanges);
}

function exchangeWithXyn()
{
	if (isBusy())
	{
		return;
	}

	for (let itemType of XynTypes)
	{
		for (let i = 0; i < character.items.length; i++)
		{
			let item = character.items[i];

			if (item && G.items[item.name].type === itemType)
			{
				writeToLog("Exchanging " + item.name + " with Xyn.. ");
				exchangeItems("exchange", item.name, 1);
				return;
			}
		}
	}
}

//	don't like that this feels necessary, but this should clean up requests not being cleaned up properly even when they are successfully completed (leading to the merchant gettings stuck)
function confirmDeliveries()
{
	if (DeliveryRequests.length === 0 && DeliveryShipments.length === 0)
	{
		return true;
	}

	for (let r of DeliveryRequests)
	{
		send_cm(r.sender, { message: "confirmDelivery" });
	}

	for (let r of DeliveryShipments)
	{
		if (!DeliveryRequests.find((x) => { if (x.sender === r.name) return x; }))
		{
			send_cm(r.sender, { message: "confirmDelivery" });
		}
	}
}