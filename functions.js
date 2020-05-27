var ready = false;
var whosReady = {priest:false,mage:false,ranger:false};
const healthPotionsToHave = 1000;
const manaPotionsToHave = 1000;
const lowPotions = 100;
const spaceToKeep = 10;
const whiteList = ["LotusPriest", "LotusMage", "LotusRanger", "LotusMerch"];

function loadCharacters()
{
    log("Loading Characters...");

	start_character(mageName, "main");
	start_character(rangerName, "main");
}

function initParty()
{
	send_party_invite(merchantName);
	send_party_invite(mageName);
	send_party_invite(rangerName);
	
	log("Party Invites sent!");
}

function stopCharacters()
{
	stop_character(mageName);
    stop_character(rangerName);
    
    farmingModeActive = false;
    whosReady = {priest:false,mage:false,ranger:false};
    ready = false;
    autoPlay = false;

	log("Characters stopped!");
}

function on_cm(sender, data)
{
	//log(character.name + " recieved cm from " + name);
	
	if(!whiteList.includes(sender))
	{
		log(character.name + " recieved unexpected cm from " + sender);
		return;		
	}
	else if(!data.message)
	{
		log(character.name + " recieved unexpected cm format from " + sender);
		return;
	}
    
	if(data.message == "target")
	{
        target = get_entity(data.targetId);

        if(target)
        {
            change_target(target, true);
        }

        return;
	}
	else if(data.message == "readycheck")
	{
		log(character.name + " recieved readycheck from " + sender);
		whosReady = {priest:false,mage:false,ranger:false};
        ready =	checkBuffs() && checkPotionInventory();

		if(sender == priestName)
			whosReady.priest = data.isReady;
		else if(sender == mageName)
			whosReady.mage = data.isReady;
		else if(sender == rangerName)
			whosReady.ranger = data.isReady;
		
		send_cm(sender, {message:"readyreply",isReady:ready});
		return;
	}
	else if(data.message == "readyreply")
	{
		log(character.name + " recieved readyreply from " + sender + ". " + sender + " is " + (data.ready?"ready!":"not ready."));
		
		if(sender == priestName)
			whosReady.priest = data.isReady;
		else if(sender == mageName)
			whosReady.mage = data.isReady;
		else if(sender == rangerName)
			whosReady.ranger = data.isReady;	
		
		return;
	}
	else if(data.message == "letsgo")
	{
        log("Let's go!");
        whosReady = {priest:true,mage:true,ranger:true};
        farmingModeActive = true;
		return;
    }
    else if(data.message == "autoToggle")
    {
        autoPlay = data.auto;
        log("autoPlay: " + autoPlay);
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
    if (whiteList.includes(name) && parent.party_list.length == 0)
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

function readyCheck()
{
	if(character.ctype === "merchant")
	{
		log("shouldn't happen");
		return;
	}
	
	whosReady = {priest:false,mage:false,ranger:false};
	ready =	checkBuffs() && checkPotionInventory();
	
	if(character.ctype === "priest")
		whosReady.priest = ready;
	if(character.ctype === "mage")
		whosReady.mage = ready;
	if(character.ctype === "ranger")
		whosReady.ranger = ready;

	if(ready)
	{
		log(character.name + " is ready!");
		
		if(!readyToGo())
		{
			parent.party_list.forEach(function(otherPlayerName)
			{
				let partyMember = parent.entities[otherPlayerName];
				if(partyMember)
				{
					send_cm(partyMember.name, {message:"readycheck",isready:ready});
				}
			});
		}
	}
	else if(!ready)
	{
		log(character.name + " is not ready!");
		
		if(!isInTown())
		{
            if(!get_targeted_monster())
                use("use_town");
            else
                goTo("main");
		}
	}
}

function readyToGo()
{
	return (whosReady.priest && whosReady.mage && whosReady.ranger);
}

function personalSpace()
{
    target = get_targeted_monster();

    if(target)
    {
        if(distance(character, target) < 20)
        {
            smart_move(character.x + (target.x - character.x) * 1.5,
            character.y + (target.y - character.y) * 1.5)
        }
    }
}

function isInTown()
{
	return (character.map === "main" && distance(character,{x:merchantStand_X,y:merchantStand_Y}) < 200);
}

function partyPresent()
{
	if(parent.party_list.length < 4)
		return false;
	
	return (get_player(priestName) || character.name === priestName) &&
			(get_player(mageName) || character.name === mageName) && 
			(get_player(rangerName) || character.name === rangerName);
}

function requestMluck()
{
	log(character.name + " requesting Mluck");
	
	let merchReq = {message:"mluck",name:character.name};
	send_cm(merchantName, merchReq);
}

function requestMagiPort()
{
	log(character.name + " requesting MagiPort");
	
	let magiReq = {message:"magiPort",name:character.name};
	send_cm(mageName, magiReq);
}

function usePotions(healthPotThreshold = 0.9, manaPotThreshold = 0.9)
{
    if(!character.rip
        && (character.hp < (character.max_hp * healthPotThreshold)
        || character.mp < (character.max_mp * manaPotThreshold)))
	{
		use_hp_or_mp();		
	}
}

function checkBuffs()
{
	if(!character.s.mluck)
	{
		requestMluck();
		return false;
	}
	else
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
			
		let potsList = 
			{message:"buyPots", hPots:healthPotsNeeded, mPots:manaPotsNeeded};
		
		send_cm(merchantName, potsList);
		
		log(character.name + " sending request for potions");
		
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

    if(character.ctype !== "merchant" && merchant
       && merchant.owner === character.owner
       && distance(character, merchant) < 400)
	{
        send_gold(merchant, character.gold)
        //if(character.items.filter(element => element).length > 4){
        for(let i = 0; i <= 34; i++)
		{
			send_item(merchant, i, 9999);
		}
        log(character.name + " sent items to merchant.");
	}
}

function followLeader()
{
	if(character.ctype === "merchant" || character.name == partyLeader)
		return;
	
	var leader = get_player(partyLeader);

	if(leader)
	{
		if (distance(character, leader) > spaceToKeep*2)
		{
        	move
			(
            	character.real_x+(leader.x-character.real_x) / 2,
            	character.real_y+(leader.y-character.real_y) / 2
        	);
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
    broadCastTarget = get_targeted_monster();
    parent.party_list.forEach(function(otherPlayerName)
    {
        if(otherPlayerName != character.name)
        {
            let partyMember = parent.entities[otherPlayerName];
        
            if(partyMember && partyMember.name != merchantName && partyMember.name != broadCastTarget.name)
            {
                send_cm(partyMember.name, {message:"target",targetId:broadCastTarget.id});
            }
        }
    });
}

function getMonsterFarmTarget(farmTarget)
{
    let target = get_targeted_monster();
    
    if(target)
    {
        if(character.name == partyLeader)
        {
           broadCastTarget(target);
        }

        return target;
    }	
	else if(!target)
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
		
		if(target && character.name == partyLeader)
		{
            change_target(target, true);
            broadCastTarget(target);
			return target;
		}
		else if(!partyLeader)
		{
            let leader = get_player(partyLeader);
            if(leader && leader.target)
            {
                change_target(leader.target);
                return;
            }
            else
            {
                target = get_nearest_monster({target:partyLeader});
            }
            
			if(target)
			{
				change_target(target, true);
				return target;
			}
		}
		
		target = get_nearest_monster
		({
			target:character.name
        });
		
		//Returns any monster that targets nobody
		target = get_nearest_monster
		({
			type:farmTarget,
			no_target:true
		});
		
		if(target)
		{
			change_target(target, true);
			return target;
		}
	}
}

function autoAttack(target)
{
    if(!is_in_range(target, "attack"))
	{
        smart_move(
            character.x + (target.x - character.x) * 0.3,
            character.y + (target.y - character.y) * 0.3
        );
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
	if(character.map != mapName)
	{
		if(oncomplete)
		{
			smart_move(mapName,function(){smart_move(coords, oncomplete);});		
		}
		else
		{
			smart_move(mapName,function(){smart_move(coords);});	
		}
	}
	else
	{
        if(oncomplete)
        {
			smart_move(coords, oncomplete);
        }
        else
        {
			smart_move(coords);
        }
	}
}