function on_cm(sender, data)
{
	if (!WhiteList.includes(sender))
	{
		log(character.name + " recieved unexpected cm from " + sender);
		return;
	}
	else if (!data.message)
	{
		log(character.name + " recieved unexpected cm format from " + sender);
		show_json(data);
		return;
	}

	if (data.message === "target")
	{
		let target = get_entity(data.targetId);

		if (target)
		{
			change_target(target);
		}
		else
		{
			log(character.name + " recieved a target from " + sender + " but could not find it.");
			let senderPlayer = parent.entities[sender];
			if (senderPlayer)
			{
				smart_move({ x: senderPlayer.x, y: senderPlayer.y });
			}
		}

		return;
	}
	else if (data.message === "readyCheck")
	{
		log(character.name + " recieved readyCheck from " + sender);
		stopFarmMode();

		let ready = false;

		if (character.name === MerchantName)
		{
			ready = parent.party_list.includes(PartyLeader);
		}
		else
		{
			ready = checkIfReady();
		}

		send_cm(sender, { message: "readyReply", isReady: ready });

		return;
	}
	else if (data.message === "readyReply")
	{
		let response = character.name + " recieved readyReply from " + sender + ". " + sender + " is " + (data.isReady ? "ready!" : "not ready. ")
		log(response);

		if (sender === PartyLeader)
		{
			WhosReady.leader = data.isReady;
		}
		else if (sender === MerchantName)
		{
			WhosReady.merchant = data.isReady;
		}
		else if (PartyList.includes(sender))
		{
			if (!WhosReady.codeBotOne && !WhosReady.codeBotTwo)
			{
				WhosReady.codeBotOne = data.isReady;
			}
			else if (WhosReady.codeBotOne && !WhosReady.codeBotTwo)
			{
				WhosReady.codeBotTwo = data.isReady;
			}
		}

		if (readyToGo())
		{
			for (let p of PartyList)
			{
				if (p !== character.name)
				{
					send_cm(p, { message: "partyReady" });
				}
			}
		}

		return;
	}
	else if (data.message === "partyReady")
	{
		log(character.name + " readyCheck approved!");
		WhosReady = { leader: true, merchant: true, codeBotOne: true, codeBotTwo: true };
		return;
	}
	else if (data.message === "letsGo")
	{
		log(character.name + " recieved Let's Go from " + sender);
		FarmingModeActive = true;
		AutoPlay = true;

		return;
	}
	else if (data.message === "autoToggle")
	{
		AutoPlay = data.auto;

		if (!AutoPlay)
		{
			FarmingModeActive = false;
			stop();
		}

		log("autoPlay: " + AutoPlay);
		return;
	}
	else if (data.message === "town")
	{
		AutoPlay = false;
		FarmingModeActive = false;
		goBackToTown();
		return;
	}
	else if (data.message === "noelixirs")
	{
		NoElixirs = true;
		SentRequests.splice(SentRequests.indexOf(SentRequests.find((x) => { if (x.request === "elixir") return x; }), 1));
		log("Continuing without elixir.");
		return;
	}

	if (character.ctype === "merchant")
	{
		merchant_on_cm(sender, data);
	}
	else if (character.ctype === "mage")
	{
		mage_on_cm(sender, data);
	}
	else if (character.ctype === "priest")
	{
		priest_on_cm(sender, data);
	}
	else if (character.ctpye === "ranger")
	{
		ranger_on_cm(sender, data);
	}

	//	this should remain the last check
	if (data.message === "confirmDelivery")
	{
		if (SentRequests.length === 0 || !SentRequests.find((x) => { if (x.name === sender) return x; }))
		{
			send_cm(sender, { message: "deliveryConfirmation", confirm: true });
		}
	}
}

function on_party_invite(name)
{
	log(character.name + " recieved party invite from " + name);

	if (WhiteList.includes(name) && !parent.party_list.includes(name))
	{
		accept_party_invite(name);
	}
}

function on_magiport(name)
{
	if (name === MageName)
	{
		if (character.ctype === "merchant")
		{
			merchant_on_magiport(name);
		}
	}
}

function classRoutine(target)
{
	if (character.ctype === "merchant")
	{
		merchantAuto(target);
	}
	else if (character.ctype === "priest")
	{
		priestAuto(target);
	}
	else if (character.ctype === "mage")
	{
		mageAuto(target);
	}
	else if (character.ctype === "ranger")
	{
		rangerAuto(target);
	}
}

function checkIfReady()
{
	let buffs = checkBuffs();
	let pots = checkPotionInventory();
	let r = buffs && pots;

	return r;
}

function sendReadyCheck()
{
	if (ReadyChecking)
	{
		return;
	}

	stopFarmMode();
	ReadyChecking = true;

	let ready = checkIfReady();

	if (character.name === PartyLeader)
	{
		WhosReady.leader = ready;
	}
	else if (character.name === MerchantName)
	{
		WhosReady.merchant = ready;
	}
	else if (PartyList.includes(character.name))
	{
		WhosReady.codeBotOne = ready;
	}
	else
	{
		log("Ready check attempt from character not in party list");
		return;
	}

	if (checkIfReady())
	{
		log(character.name + " is ready!");

		if (!readyToGo())
		{
			for (let p of PartyList)
			{
				if (p !== character.name)
				{
					send_cm(p, { message: "readyCheck", isReady: ready });
				}
			}
		}
	}
	else if (!ready)
	{
		log(character.name + " is not ready! ");

		if (!isInTown())
		{
			if (!get_targeted_monster())
			{
				use("use_town");
			}
			{
				goTo("main");
			}
		}
	}

	setTimeout(() =>
	{
		ReadyChecking = false;
	}, 30000);
}

function readyToGo()
{
	return (WhosReady.leader && WhosReady.merchant && WhosReady.codeBotOne && WhosReady.codeBotTwo);
}

//	social distancing
function personalSpace()
{
	if (is_moving(character) || smart.moving)
	{
		IsStuck = false;
		return;
	}

	let target = get_nearest_monster
		({
			target: character.name
		});

	if (!target)
	{
		target = get_nearest_monster();
	}

	if (DontKite.includes(target.mtype))
	{
		return;
	}

	//	try to move out of the monster's range
	if (target && (distance(character, target) < target.range || distance(character, target) < MinMonsterDistance))
	{
		let currentPos = { x: character.real_x, y: character.real_y };
		let right = 0;
		let up = 0;
		let reverse = IsStuck ? -1 : 1;

		if (target.x < character.x)
		{
			right = -(MinMonsterDistance) * reverse;
		}
		else
		{
			right = (MinMonsterDistance) * reverse;
		}

		if (target.y < character.y)
		{
			up = (MinMonsterDistance) * reverse;
		}
		else
		{
			up = -(MinMonsterDistance) * reverse;
		}

		let adjustment = { x: character.x + right, y: character.y + up };

		if (!isInFarmSpawnBounds(adjustment))
		{
			adjustment = { x: character.x - right, y: character.y - up };
		}

		if (character.name !== PartyLeader)
		{
			let leader = parent.entities[PartyLeader];

			//	make sure you dont run away from party
			if (leader && distance(adjustment, leader) < MaxLeaderDistance)
			{
				smart_move(adjustment, () => { stuckCheck(currentPos); });
				return;
			}
			else if (leader)
			{
				followLeader();
				return;
			}
		}

		smart_move(adjustment, () => { stuckCheck(currentPos); });
	}
}

//	used with personalSpace to get out of corners and walls
function stuckCheck(originalPosition)
{
	IsStuck = distance(originalPosition, { x: character.real_x, y: character.real_y }) < 2;

	if (IsStuck)
	{
		stop();
		writeToLog(character.name + " is stuck!");
		setTimeout(() =>
		{
			if (!IsStuck)
			{
				return;
			}

			writeToLog(character.name + " is still stuck and returning to town.");
			IsStuck = false;
			stopFarmMode();
			goBackToTown();

		}, 30000);
	}
}

function isInTown()
{
	return (character.map === MerchantStrandMap && distance(character, MerchantStandCoords) < 200);
}

function partyPresent()
{
	if (parent.party_list.length < PartyList.length)
	{
		return false;
	}

	return !!((character.name === PartyLeader || parent.entities[PartyLeader]) &&
		(character.name === PartyList[1] || parent.entities[PartyList[1]]) &&
		(character.name === PartyList[2] || parent.entities[PartyList[2]]));
}

function requestMluck()
{
	if (SentRequests.find((x) => { if (x.message === "mluck") return x; }))
	{
		log(character.name + " waiting for Mluck, resending request...");
	}
	else
	{
		log(character.name + " requesting Mluck");
		SentRequests.push({ message: "mluck", name: MerchantName });
	}

	let merchReq = { message: "mluck", name: character.name };
	send_cm(MerchantName, merchReq);
}

function requestMagiPort()
{
	log(character.name + " requesting MagiPort");

	let magiReq = { message: "magiPort", name: character.name };
	send_cm(MageName, magiReq);
}

function checkSentRequests()
{
	if (SentRequests.length === 0)
	{
		return;
	}

	log("Checking request status...");

	for (let i = SentRequests.length - 1; i >= 0; i--)
	{
		let recieved = false;

		if (SentRequests[i].message === "mluck")
		{
			if (checkMluck(character))
			{
				log("Mluck recieved. Thank you!");
				recieved = true;
			}
		}
		else if (SentRequests[i].message === "potions")
		{
			if (checkPotionInventory())
			{
				log("Potions recieved. Thank you!");
				recieved = true;
			}
		}
		else if (SentRequests[i].message === "elixir")
		{
			if (checkElixirBuff())
			{
				log("Elixir recieved. Thank you!");
				recieved = true;
			}
		}

		if (recieved)
		{
			send_cm(SentRequests[i].name, { message: "thanks", request: SentRequests[i].message });
			SentRequests.splice(i, 1);
		}
	}
}

function usePotions(healthPotThreshold = 0.9, manaPotThreshold = 0.9)
{
	if (!character.rip && (character.hp < (character.max_hp * healthPotThreshold) || character.mp < (character.max_mp * manaPotThreshold)))
	{
		use_hp_or_mp();
	}
}

function checkBuffs()
{
	let mluck;
	let elixir;

	//	check that you have mLuck from your own merchant
	if (checkMluck(character))
	{
		mluck = true;
	}
	else
	{
		//	if you have someone elses mluck and are in town just accept it, merchant will fix it after party leaves town
		mluck = !!(character.s.mluck && isInTown());
	}

	if (!mluck)
	{
		requestMluck();
	}

	elixir = checkElixirBuff();

	return (mluck && elixir);
}

//	returns true if potion inventory is OK, false if you need potions
function checkPotionInventory()
{
	let hPotions = quantity(Potions[0]);
	let mPotions = quantity(Potions[1]);

	if (mPotions < LowPotionsThreshold || hPotions < LowPotionsThreshold)
	{
		let healthPotsNeeded = HealthPotsToHave - hPotions;
		let manaPotsNeeded = ManaPotsToHave - mPotions;

		if (healthPotsNeeded < 0)
		{
			healthPotsNeeded = 0;
		}
		if (manaPotsNeeded < 0)
		{
			manaPotsNeeded = 0;
		}

		let potsList = { message: "buyPots", hPots: healthPotsNeeded, mPots: manaPotsNeeded };
		send_cm(MerchantName, potsList);

		if (SentRequests.find((x) => { if (x.message === "potions") return x; }))
		{
			log(character.name + " waiting for potions, resending request... ");

			//	try to fix the problem yourself if the merchant isn't responding
			if (hPotions === 0 || mPotions === 0)
			{
				log(character.name + " has no potions, is returning to town.");
				FarmingModeActive = false;

				if (!GoingBackToTown && !Traveling)
				{
					Traveling = true;
					goBackToTown();

					setTimeout(() =>
					{
						log(character.name + " attempting to buy potions.");
						buy_with_gold(Potions[0], healthPotsNeeded);
						buy_with_gold(Potions[1], manaPotsNeeded);

						Traveling = false;
					}, 10000);
				}
			}
		}
		else
		{
			log(character.name + " sending request for potions");
			SentRequests.push({ message: "potions", name: MerchantName });
		}

		return false;
	}
	else
	{
		return true;
	}
}

function transferAllToMerchant()
{
	if (character.name === MerchantName)
	{
		return;
	}

	let merchant = parent.entities[MerchantName];

	if (merchant && merchant.owner === character.owner && distance(character, merchant) < 400)
	{
		//	hold onto gold if you don't have potions, probably means merchant is stuck and you need to buy them yourself
		if (checkPotionInventory())
		{
			send_gold(MerchantName, character.gold)
		}

		for (let i = 0; i < character.items.length; i++)
		{
			if (character.items[i] && !ItemsToHoldOnTo.includes(character.items[i].name))
			{
				send_item(merchant, i, character.items[i].q);
			}
		}

		log(character.name + " sent gold & items to merchant.");
	}
	else
	{
		log("Need to get closer to merchant to transfer items.");
		approachTarget(MerchantName);
	}
}

function toggleCraftingMode()
{
	CraftingOn = !CraftingOn;
	log("Crafting Mode " + craftingOn);
}

function followLeader()
{
	let leader = parent.entities[PartyLeader];

	if (leader)
	{
		if (distance(character, leader) > MaxLeaderDistance)
		{
			approachTarget(leader);
		}
	}
}

function broadCastTarget(broadCastTarget)
{
	parent.party_list.forEach(function (partyPlayer)
	{
		if (partyPlayer !== character.name)
		{
			let partyMember = parent.entities[partyPlayer];

			if (partyMember && partyMember.name !== MerchantName && partyMember.name !== broadCastTarget.name)
			{
				log(character.name + " broadcasting target " + broadCastTarget.name + " to " + partyMember.name);
				send_cm(partyMember.name, { message: "target", targetId: broadCastTarget.id });
			}
		}
	});
}

function getTargetMonster(farmTarget, canPullNewMonsters = true)
{
	let target = get_targeted_monster();

	//	if you already have a target, keep it
	if (target)
	{
		return target;
	}

	//	party leader checks for nearest monster to itself that is targeting party leader
	if (character.name === PartyLeader)
	{
		target = get_nearest_monster({type: farmTarget, target: character.name});

		if (target)
		{
			return target;
		}
	}
	//	other party members check if leader has a target
	else
	{
		let leader = get_player(parent.entities[PartyLeader]);
		if (leader && leader.target != null)
		{
			target = leader.targetId;
			change_target(target);
			return target;
		}
	}

	//	target a monster that is targeting another party member
	parent.party_list.forEach(p =>
	{
		if (p !== character.name)
		{
			target = get_nearest_monster({ target: p });

			if (target)
			{
				change_target(target);
				return target;
			}
		}
	});

	//	target nearest monster that is targeting you
	target = get_nearest_monster({type: farmTarget, target: character.name});

	//	target nearest monster that has no target
	if (!target && canPullNewMonsters)
	{
		target = get_nearest_monster({type: farmTarget, no_target: true});
	}

	if (target)
	{
		change_target(target);
		return target;
	}
	else
	{
		return null;
	}
}

function approachTarget(target, onComplete)
{
	if (!target)
	{
		return;
	}

	if (!onComplete)
	{
		move(
			character.x + (target.x - character.x) * 0.3,
			character.y + (target.y - character.y) * 0.3
		);
	}
	else
	{
		smart_move({ x: character.x + (target.x - character.x) * 0.3, y: character.y + (target.y - character.y) * 0.3 }, () => { onComplete(); });
	}
}

function autoAttack(target)
{
	if (character.name === PriestName && HealingMode)
	{
		return;
	}

	if (!is_in_range(target, "attack"))
	{
		approachTarget(target);
	}
	else if (!is_on_cooldown("attack"))
	{
		attack(target).then((message) =>
		{
			reduce_cooldown("attack", character.ping);
		}).catch((message) =>
		{
			//log(character.name + " attack failed: " + message.reason);
		});
	}
}

function goTo(mapName = "main", coords = { x: 0, y: 0 }, oncomplete = null)
{
	Traveling = true;

	if (character.map !== mapName)
	{
		if (oncomplete != null)
		{
			smart_move(mapName, () => { oncomplete(); Traveling = false; });
		}
		else
		{
			smart_move(mapName, () => { Traveling = false; });
		}
	}
	else
	{
		if (oncomplete != null)
		{
			smart_move(coords, () => { oncomplete(); Traveling = false; });
		}
		else
		{
			smart_move(coords, () => { Traveling = false; });
		}
	}
}

function travelToFarmSpot()
{
	// @ts-ignore
	if (FarmMode === "coords")
	{
		goTo(FarmMap, FarmCoords);
	}
	else if (FarmMode === "name")
	{
		Traveling = true;
		smart_move(FarmMonsterName, () => { Traveling = false; });
	}
	else if (FarmMode === "number")
	{
		let coords = { x: 0, y: 0 };
		let monster = G.maps[FarmMap].monsters.find((x) => { if (x.type == FarmMonsterName && x.count == FarmMonsterSpawnNumber) return x; });

		coords.x = monster.boundary[0] + ((monster.boundary[2] - monster.boundary[0]) / 2);
		coords.y = monster.boundary[1] + ((monster.boundary[3] - monster.boundary[1]) / 2);

		goTo(FarmMap, coords);
	}
}

function goBackToTown(delay)
{
	if (GoingBackToTown)
	{
		return;
	}

	stop();

	log(character.name + " returning to town.");

	GoingBackToTown = true;
	Traveling = false;

	use("use_town");

	setTimeout(function ()
	{
		goTo(MerchantStrandMap, MerchantStandCoords, () => { GoingBackToTown = false });
	}, 5000);
}

//	sorts inventory to push all items toward the back
function tidyInventory()
{
	if (character.q.upgrade || character.q.compound)
	{
		return;
	}

	let slotToMove = -1;
	let lastEmptySlot = -1;
	for (let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if (item && item.name === "placeholder")
		{
			continue;
		}

		if (item && slotToMove === -1)
		{
			slotToMove = i;
		}
		else if (slotToMove !== -1 && !item)
		{
			lastEmptySlot = i;
		}
	}

	if (lastEmptySlot > 0)
	{
		swap(slotToMove, lastEmptySlot);
	}
}

function initParty()
{
	if (parent.party_list.length >= PartyList.length)
	{
		return;
	}

	for (let p of PartyList)
	{
		if (character.name === p)
		{
			continue;
		}

		if (!parent.party_list.includes(p) && !characterOffline(p))
		{
			send_party_invite(p);
		}
		else if (characterOffline(p))
		{
			start_character(p, 1);
		}
	}

	log("Initializing Party...");
}


//  check if you are separated from the party, and attempt to regroup in town if you are.
//  returns true if the character is alone, false if not
function aloneCheck(msToWait = 30000)
{
	if (is_moving(character) || smart.moving)
	{
		return false;
	}

	if (!partyPresent() && !AloneChecking)
	{
		if (character.name !== PartyLeader && parent.entities[PartyLeader])
		{
			followLeader();
			return false;
		}

		AloneChecking = true;
		writeToLog(character.name + " is checking if they are lost...");

		setTimeout(() =>
		{
			if (character.name !== PartyLeader && parent.entities[PartyLeader])
			{
				AloneChecking = false;
				followLeader();
				return false;
			}

			if (!isInTown() && !partyPresent() && AloneChecking)
			{
				writeToLog(character.name + " is lost & returning to town.");

				stopFarmMode();
				goBackToTown();
			}

			AloneChecking = false;

		}, msToWait);

		return true;
	}

	return !partyPresent() || AloneChecking;
}

function letsGo()
{
	if (checkIfReady())
	{
		log("Let's go!");

		for (let p of PartyList)
		{
			if (p !== character.name)
			{
				send_cm(p, { message: "letsGo" });
			}
		}

		WhosReady = { leader: true, merchant: true, codeBotOne: true, codeBotTwo: true };
		FarmingModeActive = true;
		AloneChecking = false;
	}
	else
	{
		sendReadyCheck();
	}
}

function togglePartyAuto(forceState = null)
{
	if (forceState != null)
	{
		AutoPlay = forceState;
	}
	else
	{
		AutoPlay = !AutoPlay;
	}

	if (!AutoPlay)
	{
		FarmingModeActive = false;
		stop();
	}

	if (character.name === PartyLeader)
	{
		for (let p in PartyList)
		{
			if (p !== character.name)
			{
				send_cm(p, { message: "autoToggle", auto: AutoPlay });
				log("sending autoPlayToggle to " + character.name);
			}
		}
	}

	log("autoPlay: " + AutoPlay);
}

function townParty()
{
	log("Returning party to town.");

	togglePartyAuto(false);
	goBackToTown();

	for (let p of PartyList)
	{
		if (character.name !== p && character.name !== MerchantName)
		{
			send_cm(p, { message: "town" });
		}
	}
}

//	returns true if character is offline
function characterOffline(name)
{
	if (parent.X.characters.filter((x) => { return (x.name === name && x.online === 0) }).length === 0)
	{
		return false;
	}

	return !get_active_characters()[name];
}

function stopCharacters()
{
	for (let p of PartyList)
	{
		if (p === character.name)
		{
			continue;
		}

		stop_character(p);
	}

	stopFarmMode();
	AutoPlay = false;

	log("Characters stopped!");
}

function stopFarmMode()
{
	stop();
	FarmingModeActive = false;
	WhosReady = { leader: false, merchant: false, codeBotOne: false, codeBotTwo: false };
}

function validTargetForSkill(target)
{
	if (SpecialMonsters.includes(target.mtype))
	{
		return true;
	}
	else if (target.hp > target.max_hp * MonsterHealthThreshold)
	{
		return true;
	}

	return false;
}

function checkForLowInventorySpace()
{
	let emptyInvSlots = 0;

	if (character.name !== MerchantName)
	{
		emptyInvSlots = getEmptyInventorySlotCount();
	}
	else if (character.name === MerchantName)
	{
		for (let item of character.items)
		{
			//	don't count things you are upgrading toward low inventory. compound items do count since these can take up a lot of space without being actively consumed
			if (!item || (ItemsToUpgrade.includes(item.name) && item.level < UpgradeLevelToStop))
			{
				emptyInvSlots++;
			}
		}

		if (getEmptyInventorySlotCount() < VeryLowInventoryThreshold)
		{
			return true;
		}
	}

	if (emptyInvSlots < LowInventoryThreshold)
	{
		return true;
	}
}

function getEmptyInventorySlotCount()
{
	let emptyInvSlots = 0;
	for (let item of character.items)
	{
		if (!item)
		{
			emptyInvSlots++;
		}
	}

	return emptyInvSlots;
}

function depositInventoryAtBank()
{
	if (!isInTown())
	{
		goBackToTown();
		return;
	}

	writeToLog("Depositing inventory at bank...");
	Banking = true;

	smart_move("bank", () =>
	{
		//	store in first bank
		let storeCompounds = (getEmptyInventorySlotCount() < 8);
		storeInventoryInBankVault(0, storeCompounds);

		//	store in second bank
		if (checkForLowInventorySpace())
		{
			setTimeout(() =>
			{
				storeCompounds = (getEmptyInventorySlotCount() < 8);
				storeInventoryInBankVault(1, storeCompounds);
				Banking = false;

			}, 1000);
		}
		else
		{
			Banking = false;
		}
	});
}

function storeInventoryInBankVault(bankVaultId, storeCompounds = false)
{
	for (let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if (item)
		{
			if (ItemsToHoldOnTo.includes(item.name) || VendorTrash.includes(item.name) || XynTypes.includes(G.items[item.name].type))
			{
				continue;
			}
			if (character.name === MerchantName && (!storeCompounds && ItemsToCompound.includes(item.name) && item.level < CompoundLevelToStop) || (ItemsToUpgrade.includes(item.name) && item.level < UpgradeLevelToStop))
			{
				continue;
			}

			writeToLog("Stashing " + G.items[item.name].name);
			bank_store(i, bankVaultId);
		}
	}
}

function isItemOnCraftList(itemName)
{
	return (ItemsToUpgrade.includes(itemName) || ItemsToCompound.includes(itemName));
}

function lookForSpecialTargets()
{
	for (let i = 0; i < SpecialMonsters.length; i++)
	{
		let target = getTargetMonster(SpecialMonsters[i]);
		if (target && SpecialMonsters.includes(target.mtype))
		{
			broadCastTarget(target);
			return target;
		}
	}

	return null;
}

function checkElixirBuff()
{
	let buffToExpect = null;

	if (character.ctype === "priest")
	{
		buffToExpect = "elixirint";
	}
	else if (character.ctype === "mage")
	{
		buffToExpect = "elixirint";
	}
	else if (character.ctype === "ranger")
	{
		buffToExpect = "elixirdex";
	}
	else if (character.ctype === "warrior")
	{
		buffToExpect = "elixirstr";
	}
	else if (character.ctype === "rogue")
	{
		buffToExpect = "elixirdex";
	}

	//	need elixir buff
	if (!character.slots.elixir && !NoElixirs)
	{
		//	find an elixir in your inventory
		let elixir = getElixirInventorySlot(buffToExpect);

		//	if you have an elixir, drink it
		if (elixir)
		{
			log("Drinking " + G.items[character.items[elixir].name].name);
			use(elixir);
			return true;
		}
		//	if not, ask the merchant for one
		else
		{
			if (SentRequests.find((x) => { if (x.message === "elixir") return x; }))
			{
				log("Waiting on elixir, resending request...");
			}
			else
			{
				SentRequests.push({ message: "elixir", type: buffToExpect });
			}

			send_cm(MerchantName, { message: "elixir", type: buffToExpect });

			return false;
		}
	}

	return true;
}

//	if requesting a specific level, will return null if it's not found, otherwise will return first found, checking lower levels first
function getElixirInventorySlot(elixirBaseName, elixirLevel = -1)
{
	let elixir = null;

	if (elixirLevel > -1)
	{
		elixir = locate_item(elixirBaseName + elixirLevel);
		if (elixir > -1)
		{
			return elixir;
		}
		else
		{
			return null;
		}
	}

	for (let i = 0; i <= 2; i++)
	{
		elixir = locate_item(elixirBaseName + i);

		if (elixir > -1)
		{
			return elixir;
		}
	}

	return null;
}

function dropInvalidTarget(target)
{
	if (target && target.target && target.target.player && !PartyList.includes(target.target.name) && !SpecialMonsters.includes(target.mtype))
	{
		target = null;
	}

	return target;
}

function hasUpgradableItems()
{
	if (character.items.find((x) => { if (x && ItemsToUpgrade.includes(x.name) && x.level < UpgradeLevelToStop) return x; }))
	{
		return true;
	}

	return false;
}

function isShiny(item)
{
	return item.p;
}

function xpReport()
{
	let output = []

	for (let p of PartyList)
	{
		let player = get_player(p);

		if (player)
		{
			let percent = (player.xp / G.levels[player.level]) * 100;
			output.push(player.name + ": L" + player.level + " with " + percent.toLocaleString(undefined, { maximumFractionDigits: 2 }) + "%");
		}
	}

	show_json(output);
}

function isInFarmSpawnBounds(coords)
{
	let monster = G.maps[FarmMap].monsters.find((x) => { if (x.type === FarmMonsterName && x.count === FarmMonsterSpawnNumber) return x; });

	let center = { x: 0, y: 0 };
	center.x = monster.boundary[0] + ((monster.boundary[2] - monster.boundary[0]) / 2);
	center.y = monster.boundary[1] + ((monster.boundary[3] - monster.boundary[1]) / 2);

	return distance(coords, center) < FarmRadius;
}

// Reload code on character (yoinked from discord)
function reloadCharacter(name)
{
	if (name === character.name)
	{
		say("/pure_eval setTimeout(function(){parent.start_runner()}, 500)");
		parent.stop_runner();
	} 
	else
	{
		const rid = "ichar" + name;//.toLowerCase();
		if (parent.document.getElementById(rid).contentWindow.code_active)
		{
			parent.document.getElementById(rid).contentWindow.stop_runner();
			parent.document.getElementById(rid).contentWindow.start_runner();
		}
	}
}

function reloadCharacters()
{
	for(let p in PartyList)
	{
		reloadCharacter(p);
	}
}