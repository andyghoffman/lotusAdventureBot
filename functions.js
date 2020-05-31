function on_cm(sender, data)
{
	if(!whiteList.includes(sender))
	{
		log(character.name + " recieved unexpected cm from " + sender);
		return;
	}
	else if(!data.message)
	{
		log(character.name + " recieved unexpected cm format from " + sender);
		show_json(data);
		return;
	}

	if(data.message == "target")
	{
        target = get_entity(data.targetId);

        if(target)
        {
            change_target(target, true);
		}
		else
		{
			log(character.name + " recieved target " + target.name + " from " + sender + " but could not find it.");
		}

        return;
	}
	else if(data.message == "readyCheck")
	{
		log(character.name + " recieved readyCheck from " + sender);
		stopFarmMode();

		let ready, buffs, pots = false;

		if(character.name == merchantName)
		{
			ready = parent.party_list.includes(partyLeader);
		}
		else
		{
			buffs = checkBuffs();
			pots = checkPotionInventory();
			ready = buffs & pots;
		}

		send_cm(sender, {message:"readyReply",isReady:ready,hasBuffs:buffs,hasPots:pots});
		return;
	}
	else if(data.message == "readyReply")
	{
		let reason = character.name + " recieved readyReply from " + sender + ". " + sender + " is " + (data.isReady?"ready!":"not ready. ")

		if(sender != merchantName)
		{
			if(!data.hasBuffs)
				reason += sender + " is missing buffs. ";
			if(!data.hasPots)
				reason += sender + " is missing pots. ";
		}

		log(reason);

		if(sender == partyLeader)
		{
			whosReady.leader = data.isReady;
		}
		else if(sender == merchantName)
		{
			whosReady.merchant = data.isReady;
		}
		else if(partyList.includes(sender))
		{
			if(!whosReady.codeBotOne && !whosReady.codeBotTwo)
			{
				whosReady.codeBotOne = data.isReady;
			}
			else if(whosReady.codeBotOne && !whosReady.codeBotTwo)
			{
				whosReady.codeBotTwo = data.isReady;
			}
		}

		if(readyToGo())
		{
			for(let p of partyList)
			{
				if(p != character.name)
				{
					send_cm(sender, {message:"partyReady"});
				}
			}
		}

		return;
	}
	else if(data.message == "partyReady")
	{
        log("Ready!");
        whosReady = {leader:true,merchant:true,codeBotOne:true,codeBotTwo:true};
		return;
    }
	else if(data.message == "letsGo")
	{
        log("Let's go!");
        whosReady = {leader:true,merchant:true,codeBotOne:true,codeBotTwo:true};
		farmingModeActive = true;
		autoPlay = fullAuto;

		return;
    }
    else if(data.message == "autoToggle")
    {
		autoPlay = data.auto;

		if(!autoPlay)
		{
			farmingModeActive = false;
		}

        log("autoPlay: " + autoPlay);
        return;
	}
	else if(data.message == "town")
	{
		returnToTown();
		return;
	}

	if(character.ctype === "merchant")
	{
		merchant_on_cm(sender, data);
	}
	else if(character.ctype === "mage")
	{
		mage_on_cm(sender, data);
	}
	else if(character.ctype === "priest")
	{
		priest_on_cm(sender, data);
	}
	else if(character.ctpye === "ranger")
	{
		ranger_on_cm(sender, data);
	}
}

function on_party_invite(name)
{
	log(character.name + " recieved party invite from " + name);

    if (whiteList.includes(name) && !parent.party_list.includes(name))
	{
		accept_party_invite(name);
	}
}

function on_magiport(name)
{
	if(name == mageName)
	{
		if(character.ctype === "merchant")
		{
			merchant_on_magiport(name);
		}
	}
}

function classRoutine(target)
{
    if(character.ctype == "merchant")
    {
        merchantAuto(target);
    }
    else if(character.ctype == "priest")
    {
        priestAuto(target);
    }
    else if(character.ctype == "mage")
    {
        mageAuto(target);
    }
    else if(character.ctype == "ranger")
    {
        rangerAuto(target);
    }
}

function readyCheck()
{
	if(readyChecking)
	{
		return;
	}

	stopFarmMode();
	readyChecking = true;

	let buffs = checkBuffs();
	let pots = checkPotionInventory();
	let ready = buffs && pots;

	if(character.name == partyLeader)
	{
		whosReady.leader = ready;
	}
	else if(character.name == merchantName)
	{
		whosReady.merchant = ready;
	}
	else if(partyList.includes(character.name))
	{
		whosReady.codeBotOne = ready;
	}
	else
	{
		log("Ready check attempt from character not in party list");
		return;
	}

	if(ready)
	{
		log(character.name + " is ready!");

		if(!readyToGo())
		{
			for(let p of partyList)
			{
				if(p != character.name)
				{
					send_cm(p, {message:"readyCheck",isReady:ready});
				}
			}
		}
	}
	else if(!ready)
	{
		let reason = character.name + " is not ready! ";
		if(!buffs)
			reason += character.name + " is missing buffs. ";
		if(!pots)
			reason += character.name + " is missing pots. ";

		log(reason);

		if(!isInTown())
		{
            if(!get_targeted_monster())
                use("use_town");
            else
                goTo("main");
		}
	}

	setTimeout(()=>
	{
		readyChecking = false;
	}, 30000);
}

function readyToGo()
{
	return (whosReady.leader && whosReady.merchant && whosReady.codeBotOne && whosReady.codeBotTwo);
}

//	social distancing
function personalSpace()
{
	if(is_moving(character) || smart.moving)
	{
		isStuck = false;
		return;
	}

	let target = get_nearest_monster
	({
		target:character.name
	});

	if(!target)
	{
		target = get_nearest_monster();
	}

	//	try to move out of the monster's range
    if(target && (distance(character, target) < target.range || distance(character, target) < minimumMonsterDistance))
    {
		let currentPos = {x:character.real_x,y:character.real_y};
		let right = 0;
		let up = 0;
		let reverse = isStuck ? -2 : 1;

		if(target.x < character.x)
		{
			right = -(target.range+minimumMonsterDistance) * reverse;
		}
		else
		{
			right = (target.range+minimumMonsterDistance) * reverse;
		}

		if(target.y < character.y)
		{
			up = (target.range+minimumMonsterDistance) * reverse;
		}
		else
		{
			up = -(target.range+minimumMonsterDistance) * reverse;
		}

		adjustment = {x:character.x+right, y:character.y+up};

		if(character.name != partyLeader)
		{
			let leader = parent.entities[get_player(partyLeader)];

			//	make sure you dont run away from party
			if(leader && distance(adjustment, leader) < maxLeaderDistance)
			{
				smart_move(adjustment, ()=>{stuckCheck(currentPos);});
				return;
			}
			else if(leader)
			{
				followLeader();
				return;
			}
		}

		smart_move(adjustment, ()=>{stuckCheck(currentPos);});
    }
}

//	used with personalSpace to get out of corners and walls
var isStuck = false;
function stuckCheck(originalPosition)
{
	isStuck = distance(originalPosition, {x:character.real_x,y:character.real_y}) < 2;

	if(isStuck)
	{
		log(character.name + " is stuck!");
		setTimeout(()=>
		{
			if(!isStuck)
			{
				return;
			}

			log(character.name + " is still stuck and returning to town.");
			isStuck = false;
			stopFarmMode();
            returnToTown();

		}, 15000);
	}
}

function isInTown()
{
	return (character.map == merchantStandMap && distance(character,merchantStandCoords) < 200);
}

function partyPresent()
{
	if(parent.party_list.length < 4)
	{
		return false;
	}

	if((character.name === partyLeader || parent.entities[partyLeader]) &&
	(character.name === partyList[1] || parent.entities[partyList[1]] ) &&
	(character.name === partyList[2] || parent.entities[partyList[2]]))
	{
		return true;
	}
	else
	{
		return false;
	}
}

function requestMluck()
{
	if(sentRequests.find(x=>x.message=="mluck"))
	{
		log(character.name + " waiting for Mluck, resending request...");
	}
	else
	{
		log(character.name + " requesting Mluck");
		sentRequests.push({message:"mluck",name:merchantName});
	}

	let merchReq = {message:"mluck",name:character.name};
	send_cm(merchantName, merchReq);
}

function requestMagiPort()
{
	log(character.name + " requesting MagiPort");

	let magiReq = {message:"magiPort",name:character.name};
	send_cm(mageName, magiReq);
}

function checkSentRequests()
{
	if(sentRequests.length == 0)
	{
		return;
	}

	log("Checking request status...");

	for(let i = sentRequests.length-1; i >= 0; i--)
	{
		if(sentRequests[i].message == "mluck")
		{
			if(checkMluck(character))
			{
				log("Mluck recieved. Thank you!");
				send_cm(sentRequests[i].name, {message:"thanks",request:"mluck"});
				sentRequests.splice(i);
			}
		}
		else if(sentRequests[i].message == "potions")
		{
			if(checkPotionInventory())
			{
				log("Potions recieved. Thank you!");
				send_cm(sentRequests[i].name, {message:"thanks",request:"potions"});
				sentRequests.splice(i);
			}
		}
	}
}

function usePotions(healthPotThreshold = 0.9, manaPotThreshold = 0.9)
{
    if(!character.rip && (character.hp < (character.max_hp * healthPotThreshold) || character.mp < (character.max_mp * manaPotThreshold)))
	{
		use_hp_or_mp();
	}
}

function checkBuffs()
{
	//	check that you have mLuck from merchant
	if(!character.s.mluck || character.s.mluck.f != merchantName)
	{
		//	if you have someone elses mluck and in town just accept it, merchant will fix it after it leaves
		if(character.s.mluck && isInTown())
		{
			return true;
		}

		requestMluck();
		return false;
	}
	else if(character.s.mluck && character.s.mluck.f == merchantName)
	{
		return true;
	}
}

function checkPotionInventory()
{
	let	hPotions = quantity("hpot0");
	let mPotions = quantity("mpot0");

	if(mPotions < lowPotions || hPotions < lowPotions)
	{
		let healthPotsNeeded = healthPotionsToHave - hPotions;
		let manaPotsNeeded = manaPotionsToHave - mPotions;
		let potsList = {message:"buyPots", hPots:healthPotsNeeded, mPots:manaPotsNeeded};
		send_cm(merchantName, potsList);

		if(sentRequests.find(x=>x.message=="potions"))
		{
			log(character.name + " waiting for potions, resending request... ");
		}
		else
		{
			log(character.name + " sending request for potions");
			sentRequests.push({message:"potions",name:merchantName});
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
	if(character.ctype === "merchant")
		return;

	let merchant = get_player(merchantName);

    if(character.ctype !== "merchant" && merchant && merchant.owner === character.owner && distance(character, merchant) < 400)
	{
		send_gold(merchant, character.gold)

        for(let i = 0; i < character.items.length; i++)
		{
			if(character.items[i] && !itemsToHoldOnTo.includes(character.items[i].name))
			{
				send_item(merchant, i, character.items[i].q);
			}
		}

        log(character.name + " sent gold & items to merchant.");
	}
}

function toggleCraftingMode()
{
	craftingOn = !craftingOn;
	log("Crafting Mode " + craftingOn);
}

function followLeader()
{
	if(character.ctype === "merchant" || character.name == partyLeader)
		return;

	var leader = get_player(partyLeader);

	if(leader)
	{
		if (distance(character, leader) > maxLeaderDistance)
		{
			approachTarget(leader);
		}

		return true;
	}
	else
	{
		return false;
	}
}

function broadCastTarget(broadCastTarget)
{
    parent.party_list.forEach(function(partyPlayer)
    {
        if(partyPlayer != character.name)
        {
            let partyMember = parent.entities[partyPlayer];

            if(partyMember && partyMember.name != merchantName && partyMember.name != broadCastTarget.name)
            {
				log(character.name + " broadcasting target " + broadCastTarget.name + " to " + partyMember.name);
                send_cm(partyMember.name, {message:"target",targetId:broadCastTarget.id});
            }
        }
    });
}

function getMonsterFarmTarget(farmTarget)
{
    let target = get_targeted_monster();

	//	if already have target, keep it
    if(target)
    {
        return target;
	}
	//	find a target
	else if(!target)
	{
		//	party leader checks for nearest monster to itself
        if(character.name == partyLeader)
        {
			target = get_nearest_monster
			({
				target:character.name
			});

			if(target)
			{
				return target;
			}
		}
		//	other party members check if leader has a target
		else
		{
			let leader = get_player(parent.entities[partyLeader]);
			if(leader && leader.target != null)
			{
				target = leader.targetId;
				change_target(target, true);
				return target;
			}
		}

		//	target a monster that is targeting another party member
		if(!target)
		{
			parent.party_list.forEach(partyMemberName =>
			{
					target = get_nearest_monster({target:partyMemberName});
					if(target)
					{
						change_target(target, true);
						return target;
					}
			});
		}

		//	target nearest monster to yourself that is targeting you
		target = get_nearest_monster
		({
			target:character.name
        });

		//	target nearest monster that has no target
		if(!target)
		{
			target = get_nearest_monster
			({
				type:farmTarget,
				no_target:true
			});
		}

		if(target)
		{
			change_target(target, true);
			return target;
		}
	}
}

function approachTarget(target, onComplete)
{
	if(!target)
	{
		target = get_current_target();
	}

	if(!onComplete)
	{
		move(
			character.x + (target.x - character.x) * 0.3,
			character.y + (target.y - character.y) * 0.3
		);
	}
	else
	{
		smart_move(
			character.x + (target.x - character.x) * 0.3,
			character.y + (target.y - character.y) * 0.3
		, ()=>{onComplete();});
	}
}

function autoAttack(target)
{
    if(!is_in_range(target, "attack"))
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

function goTo(mapName = "main", coords = {x:0,y:0} , oncomplete = null)
{
	traveling = true;

	if(character.map != mapName)
	{
		if(oncomplete != null)
		{
			smart_move(mapName, ()=>{oncomplete(); traveling = false;});
		}
		else
		{
			smart_move(mapName, ()=>{traveling = false;});
		}
	}
	else
	{
		if(oncomplete != null)
		{
			smart_move(coords, ()=>{oncomplete(); traveling = false;});
		}
		else
		{
			smart_move(coords, ()=>{traveling = false;});
		}
	}
}

function travelToFarmSpot()
{
	if(farmMode == "coords")
	{
		goTo(farmMap, farmCoords);
	}
	else if(farmMode == "name")
	{
		traveling = true;
		smart_move(farmMonsterName, ()=>{traveling = false;});
	}
	else if(farmMode == "number")
	{

	}
}

function returnToTown(delay)
{
	if(returningToTown)
		return;

	log(character.name + " returning to town.");

	returningToTown = true;

	use("use_town");

	setTimeout(function()
	{
		goTo(merchantStandMap,merchantStandCoords,()=>{returningToTown=false});
	}, 5000);
}

//	sorts inventory to push all items toward the back
function tidyInventory()
{
	if(character.q.upgrade || character.q.compound)
	{
		return;
	}

	let slotToMove = -1;
	let lastEmptySlot = -1;
	for(let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if(item && item.name == "placeholder")
		{
			continue;
		}

		if(item && slotToMove == -1)
		{
			slotToMove = i;
		}
		else if(slotToMove != -1 && !item)
		{
			lastEmptySlot = i;
		}
	}

	if(lastEmptySlot > 0)
	{
		swap(slotToMove, lastEmptySlot);
	}
}

function initParty()
{
	if(parent.party_list.length == 4)
	{
		return;
	}

	for(let p of partyList)
	{
		if(character.name == p)
		{
			continue;
		}

		if(!parent.party_list.includes(p) && !characterOffline(p))
		{
			send_party_invite(p);
		}
		else if(characterOffline(p))
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
    if(is_moving(character) || smart.moving)
    {
        return false;
    }

    if(!partyPresent() && !aloneChecking)
    {
        if(character.name != partyLeader)
        {
            if(parent.entities[partyLeader])
            {
                followLeader();
                return false;
            }
        }

        aloneChecking = true;
        log(character.name + " is checking if they are lost...");

        setTimeout(function()
        {
            if(character.name != partyLeader && parent.entities[partyLeader])
            {
                aloneChecking = false;
                followLeader();
                return false;
            }

            if(!isInTown() && !partyPresent() && aloneChecking)
            {
                log(character.name + " is lost & returning to town.");

                stopFarmMode();
                returnToTown();
            }

            aloneChecking = false;

        }, msToWait);

        return true;
    }

    if(!partyPresent() || aloneChecking)
    {
        return true;
    }
    else
    {
        return false;
    }
}

function letsGo()
{
	if(checkBuffs() && checkPotionInventory())
	{
		log("Let's go!");

		for(let p of partyList)
		{
			if(p != character.name)
			{
				send_cm(p, {message:"letsGo"});
			}
		}

		whosReady = {leader:true,merchant:true,codeBotOne:true,codeBotTwo:true};
		farmingModeActive = true;
		aloneChecking = false;
	}
	else
	{
		readyCheck();
	}
}

function toggleAutoPlay(forceState=null)
{
	if(forceState != null)
	{
		autoPlay = forceState;
	}
	else
	{
		autoPlay = !autoPlay;
	}

    if(!autoPlay)
    {
        farmingModeActive = false;
    }

    if(character.name == partyLeader)
    {
		for(let p in partyList)
		{
			if(p != character.name)
			{
				send_cm(character.name, {message:"autoToggle",auto:autoPlay});
				log("sending autoPlayToggle to " + character.name);
			}
		}
    }

    log("autoPlay: " + autoPlay);
}

function returnPartyToTown()
{
    log("Returning party to town.");

	toggleAutoPlay(false);
	returnToTown();

	for(let p of partyList)
	{
		if(character.name != p)
		{
			send_cm(p, {message:"town"});
		}
	}
}

//	returns true if character is offline
function characterOffline(name)
{
	if(parent.X.characters.filter((x)=>{return (x.name==name && x.online == 0)}).length == 0)
	{
		return false;
	}

	if(!get_active_characters()[name])
	{
		return true;
	}
	else
	{
		return false;
	}
}

function stopCharacters()
{
	stop_character(mageName);
    stop_character(rangerName);

	stopFarmMode();

    autoPlay = false;

	log("Characters stopped!");
}

function stopFarmMode()
{
	if(is_moving(character) || smart.moving)
	{
		stop("move");
	}

    farmingModeActive = false;
    whosReady = {leader:false,merchant:false,codeBotOne:false,codeBotTwo:false};
}

function validTargetForSkill(target)
{
	if(specialMonsters.includes(target.name))
	{
		return true;
	}
	else if(target.hp > target.max_hp*monsterHpThresholdForSkills)
	{
		return true;
	}

	return false;
}

function checkForLowInventorySpace()
{
	let emptyInvSlots = 0;
	for(let item of character.items)
	{
		if(!item)
		{
			emptyInvSlots++;
		}
		//	don't count things you are upgrading toward low inventory. compound items do count since these can take up a lot of space
		else if(character.name == merchantName && isItemOnCraftList(item.name) && !itemsToCompound.includes(item.name))
		{
			emptyInvSlots++;
		}
	}

	return emptyInvSlots <= lowInventoryThreshold;
}

function depositInventoryAtBank()
{
	if(!isInTown())
	{
		returnToTown();
		return;
	}

	log("Depositing inventory at bank...");
	banking = true;

	smart_move("bank", ()=>
	{
		//	store in first bank
		storeInventoryInBankVault(0);

		//	store in second bank
		if(checkForLowInventorySpace())
		{
			setTimeout(()=>
			{
				storeInventoryInBankVault(1);
				banking = false;

			}, 1000);
		}
		else
		{
			banking = false;
		}
	});
}

function storeInventoryInBankVault(bankVaultId)
{
	for(let i = 0; i < character.items.length; i++)
	{
		let item = character.items[i];

		if(item)
		{
			if(itemsToHoldOnTo.includes(item.name) || vendorTrash.includes(item.name))
			{
				continue;
			}
			if(character.name == merchantName && (itemsToCompound.includes(item.name) && item.level < compoundLevelToStop) || (itemsToUpgrade.includes(item.name) && item.level < upgradeLevelToStop))
			{
				continue;
			}

			bank_store(i, bankVaultId);
		}
	}
}

function isItemOnCraftList(itemName)
{
	let r = (!itemsToHoldOnTo.includes(itemName) && (itemsToUpgrade.includes(itemName) || itemsToCompound.includes(itemName)));
	return r;
}

function lookForSpecialTargets()
{
	for(let i = 0; i < specialMonsters.length; i++)
	{
		target = getMonsterFarmTarget(specialMonsters[i]);
		if(target && specialMonsters.includes(target.name))
		{
			broadCastTarget(target);
			return target;
		}
	}

	return null;
}