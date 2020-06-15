//load_file("C:/GitHub/lotusAdventureBot/code/Crafting.24.js");

function craftUpgrades()
{
	for (let i = 1; i <= 10; i++)
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

		if (item && Settings["UpgradeList"][item.name] && item.level < Settings["UpgradeList"][item.name] && !isShiny(item))
		{
			log("Upgrading " + G.items[item.name].name + "...");

			let scroll = "scroll0";
			if ((item.level > 1 && item.tier > 1) || item.level >= G.items[item.name].grades[0])
			{
				scroll = "scroll1";
			}

			if ((item.level >= 7 && item.tier > 1) || (item.level >= 6 && item.tier >= 2))
			{
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
				writeToLog("Buying " + G.items[scroll].name);
				buy_with_gold(scroll);
				return true;
			}
		}
	}

	return false;
}

function craftCompounds(levelToStop = 2)
{
	for (let i = 0; i < levelToStop; i++)
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

	for(let targetItemName in Settings["CompoundList"])
	{
		let count = 0;
		triple = [-1, -1, -1];

		for (let k = 0; k < character.items.length; k++)
		{
			let item = character.items[k];
			if (item && item.name === targetItemName && item.level === levelToUse && count < 3 && !isShiny(item))
			{
				triple[count] = k;
				count++;
			}
		}

		//	found a triple, stop looking
		if (triple[0] !== -1 && triple[1] !== -1 && triple[2] !== -1)
		{
			foundItem = targetItemName;
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
	if (item.level >= 1 || item.level >= G.items[foundItem].grades[0])
	{
		scroll = "cscroll1";
	}

	let scrollToUse = locate_item(scroll);

	if (item > -1 && scrollToUse > -1)
	{
		log("Compounding three +" + levelToUse + " " + G.items[foundItem].name + "...");
		compound(triple[0], triple[1], triple[2], scrollToUse);
		return true;
	} 
	else if(item > -1 && scrollToUse === -1)
	{
		writeToLog("Buying " + G.items[scroll].name);
		buy_with_gold(scroll);
		return true;
	}
	else
	{
		return false;		
	}
}

function isShiny(item)
{
	return item.p;
}