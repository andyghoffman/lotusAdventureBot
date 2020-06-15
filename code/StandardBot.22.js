//load_file("C:/GitHub/lotusAdventureBot/code/StandardBot.22.js");

let Settings =
	{
		"PotionStock":1000,
		"LowPotionThreshold":100,
		"Wallet":250000,
		"HoldItems":["tracker","hpot1","mpot1"],
		"Party":[],
		"LowInventory":14,
	};
let State = {};
let Intervals = {};
let Flags = {};

function startBotCore(settings)
{
	game.on("stateChanged", onStateChanged);
	game.on("idle", onIdle);
	game.on("death", onDeath);
	game.on("level_up", onLevelUp);
	
	loadSettings(settings);
	initBotComms();
	
	Intervals["Loot"] = setInterval(()=>
	{
		if(character.rip) { return; }
		loot();
	}, 100);

	Intervals["UsePotions"] = setInterval(() =>
	{
		if (character.rip) { return; }
		usePotions();
	}, 100);
	
	Intervals["CheckPotions"] = setInterval(()=>
	{
		if (character.rip) { return; }
		checkPotions();
	}, 5000);
	
	Intervals["InventoryManagement"] = setInterval(()=>
	{
		let merchant = getOnlineMerchant();
		if(get_player(merchant.name))
		{
			sendItemsAndGoldToMerchant();
		}
	}, 5000);
	
	Intervals["IdleCheck"] = setInterval(() =>
	{
		if(Flags["IdleChecking"] || !getState("Idle"))
		{
			return;
		}
		
		Flags["IdleChecking"] = true;
		
		setTimeout(() =>
		{
			if (getState("Idle"))
			{
				game.trigger("idle");
			}

			Flags["IdleChecking"] = false;

		}, 5000);
		
	}, 3000);
	
	log(character.name + " StandardBot loaded!");
	
	setState("Idle");
}

function onStateChanged(newState)
{
	log("State changed to: " + getState());

	switch (newState)
	{
		case "NeedPotions":
			buyPotions(Settings["PotionStock"], Settings["PotionStock"]);
			break;
		case "Farming":
			startCombatInterval();
			break;
		case "Idle":
			break;
		case "Dead":
			stopCombatInterval();
			Intervals["Respawn"] = setInterval(()=>
			{
				if(character.rip)
				{
					respawn();
				}
				else
				{
					setState("Idle");
					clearInterval(Intervals["Respawn"]);
				}
			}, 1000);
			break;
	}
}

function onIdle()
{
	if (Flags["Farming"])
	{
		beginFarming();
	}
	else if(!isInTown())
	{
		goToTown();		
	}
}

function onDeath(data)
{
	if (data.id === character.name)
	{
		writeToLog(data.id + " died!");
		setState("Dead");
	}
}

function onLevelUp(data)
{
	if (character.name === data.name)
	{
		writeToLog(data.name + " is now level " + data.level + "!");
	}
}

function sendItemsAndGoldToMerchant()
{
	let merchant = get_player(getOnlineMerchant().name);
	
	if(character.name === merchant.name)
	{
		return;
	}
	
	if(merchant && distance(character, merchant) < 200 && character.gold > Settings["Wallet"])
	{
		let gold = character.gold - Settings["Wallet"];
		writeToLog(character.name + " sending " + gold + " gold to " + merchant.name);
		send_gold(merchant.name, gold);
		
		for(let i = 0; i < character.items.length; i++)
		{
			let item = character.items[i];
			
			if(item && !Settings["HoldItems"].includes(item.name))
			{
				writeToLog(character.name + " sending " + G.items[item.name].name + " to " + merchant.name);
				send_item(merchant.name, i, item.q);
			}
		}
	}
}

function checkPotions()
{
	if(getState("NeedPotions") || getState("Traveling"))
	{
		return;
	}
	
	let hPots = Settings["PotionStock"] - quantity("hpot1");
	let mPots = Settings["PotionStock"] - quantity("mpot1");
	let thresh = Settings["PotionStock"] - Settings["LowPotionThreshold"];
	
	if(hPots > thresh || mPots > thresh)
	{
		let merchant = getOnlineMerchant();

		if(quantity("hpot1") === 0 || quantity("mpot1") === 0)
		{
			writeToLog(character.name + " needs to buy potions!");
			setState("NeedPotions");
		}
		else if (merchant && character.name !== merchant.name)
		{
			let message = {
				message: "NeedPotions",
				hpots: hPots,
				mpots: mPots,
			};
			requestMerchant(message);
		}
	}
}

function buyPotions(hpots, mpots)
{
	log("Buying Potions");
	
	if(!isInTown())
	{
		goToTown();
	}
	else if(getState("NeedPotions"))
	{
		let h =  hpots - quantity("hpot1");
		
		if(h > 0)
		{
			writeToLog("Buying " + h + " health potions.");
			buy_with_gold("hpot1", h);			
		}
		
		let m = mpots - quantity("mpot1");
		
		if(m > 0)
		{
			writeToLog("Buying " + m + " mana potions.");
			buy_with_gold("mpot1", m);			
		}

		setState("Idle");
	}
}

function goToTown(onComplete=()=>{})
{
	setState("Traveling");
	stop();
	stopCombatInterval();
	use_skill("use_town");
	setTimeout(()=>
	{
		travelTo("main", null, onComplete);		
	}, 8000);
}

function isInTown()
{
	return (character.map === "main" && distance(character, {x:0, y:0}) < 150);
}

function usePotions()
{
	if (character.rip)
	{
		return;
	}

	let hPotRecovery = 400;//G.items[Potions[0]].gives.hp;
	let mPotRecovery = 500;//G.items[Potions[1]].gives.mp;

	if ((character.hp <= (character.max_hp - hPotRecovery) || character.mp <= (character.max_mp - mPotRecovery)) || getState("Idle") )
	{
		use_hp_or_mp();
	}
}

function startCombatInterval()
{
	if(Intervals["Combat"])
	{
		log("Combat interval already started!");
		return;
	}
	
	log("Combat interval starting.");

	Intervals["Combat"] = setInterval(() =>
	{
		positionRoutine();
		
		let target = findPriorityTarget();
		
		if(!target)
		{
			findTarget(Settings["FarmMonster"]);
		}
		
		if(target && !is_on_cooldown("attack"))
		{
			if(characterCombat(target))
			{
				return;
			}

			autoAttack(target);
		}
		
	}, 50);
}

function stopCombatInterval()
{
	clearInterval(Intervals["Combat"]);
	Intervals["Combat"] = null;
}

function autoAttack(target)
{
	if(!target || character.mp < character.mp_cost)
	{
		return false;
	}
	
	if (!is_in_range(target, "attack"))
	{
		approach(target);
	}
	else if (!is_on_cooldown("attack"))
	{
		reduce_cooldown("attack", character.ping);
		
		attack(target).then((message) =>
		{

		}).catch((message) =>
		{
			//log(character.name + " attack failed: " + message.reason);
		});
		
		return true;
	}
	
	return false;
}

function approach(target)
{
	if(is_moving(character) || smart.moving)
	{
		return;
	}
	
	let adjustment = {x:0, y:0};
	
	if(target.x && target.y)
	{
		adjustment.x = character.x + (target.x - character.x) * 0.3;
		adjustment.y = character.y + (target.y - character.y) * 0.3;
		
		if(!can_move_to(adjustment.x, adjustment.y))
		{
			return;
		}
		
		if(distance(character, adjustment) < character.range)
		{
			move(adjustment.x, adjustment.y);
		}
		else
		{
			smart_move(adjustment);
		}
	}
}

function findPriorityTarget()
{
	let currentTarget = get_nearest_monster({target: character});
	if(currentTarget)
	{
		return currentTarget
	}
	
	for(let index in Settings["PriorityTargets"])
	{
		let name = Settings["PriorityTargets"][index];
		let target = findTarget(name);
		
		if(target)
		{
			return target;
		}
	}
	
	return false;
}

function findTarget(mtype)
{
	let target = get_targeted_monster();
	
	if(!target || target.rip)
	{
		target = get_nearest_monster({type: mtype, target: character.name});
	}
	
	if(!target || target.rip)
	{
		for (let p of parent.party_list)
		{
			if (p !== character.name)
			{
				target = get_nearest_monster({target: p});
				break;
			}
		}
	}
	
	if(!target || target.rip)
	{
		target = get_nearest_monster({type: mtype, no_target: true});
	}
	
	if(target)
	{
		change_target(target);
		return target;		
	}
	else
	{
		return null;
	}
}

function beginFarming()
{
	Flags["Farming"] = true;

	checkPotions();
	
	if(getState("NeedPotions"))
	{
		return;
	}
	
	log("Traveling to farming location.");
	travelTo(Settings["FarmMap"], getFarmLocation(), ()=>
	{
		setState("Farming"); 
	});
}

function travelTo(map, coords=null, onComplete=()=>{})
{
	let log = character.name + " traveling to " + map;
	if(coords != null)
	{
		log += " (" + coords.x +", " + coords.y + ")";
	}
	writeToLog(log);
	
	stop();
	setState("Traveling");
	
	if (character.map !== map)
	{
		smart_move(map, () =>
		{
			if(coords != null)
			{
				smart_move(coords, () =>
				{
					setState("Traveling", false);
					onComplete();
				});		
			}
			else
			{
				setState("Traveling", false);
				onComplete();
			}
		});
	} 
	else
	{
		if(coords == null)
		{
			smart_move(map, () =>
			{
				setState("Traveling", false);
				onComplete();
			});			
		}
		else
		{
			smart_move(coords, () =>
			{
				setState("Traveling", false);
				onComplete();
			});		
		}
	}	
}

function getFarmLocation()
{
	let coords = {x: 0, y: 0};

	let monster = G.maps[Settings["FarmMap"]].monsters.find((x) =>
	{
		if (x.type === Settings["FarmMonster"] && x.count === Settings["FarmSpawn"]) return x;
	});

	coords.x = monster.boundary[0] + ((monster.boundary[2] - monster.boundary[0]) / 2);
	coords.y = monster.boundary[1] + ((monster.boundary[3] - monster.boundary[1]) / 2);
	
	return coords;
}

function setState(state, isTrue=true)
{
	if(isTrue)
	{
		for (let s in State)
		{
			State[s] = false;
		}
	}
	
	State[state] = isTrue;
	
	if(!isTrue)
	{
		State["Idle"] = true;
	}
	
	game.trigger("stateChanged", state);
}

function getState(state=null)
{
	if(state == null)
	{
		for (let s in State)
		{
			if(State[s] === true)
			{
				return s;
			}
		}
	}
	else
	{
		return State[state];
	}
	
	return false;
}

function loadSettings(settings)
{
	for (let s in settings)
	{
		Settings[s] = settings[s];

		log(s + ": " + Settings[s]);

		switch (s)
		{
			case "":
				break;
		}
	}	
}