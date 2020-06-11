//load_file("C:/GitHub/lotusAdventureBot/characters/LotusMerch.6514031330852864.js");

function loadCharacter()
{
	let upgradeList = [];
	let compoundList = [];
	let vendorTrash = ["sstinger", "ringsj", "cclaw", "hpamulet", "hpbelt", "vitring", "vitearring", "vitscroll", "cshell"];
	let pontyList = ["ascale", "cscale", "pleather", "bfur", "seashell", "leather", "firestaff", "suckerpunch", "t2dexamulet", "t2intamulet", "rabbitsfoot", "ringofluck", "cape", "ecape", "angelwings", "bcape", "orbg", "hbow", "t2bow", "seashell"];
	let merchantItems = ["stand0", "scroll0", "scroll1", "cscroll0", "cscroll1", "seashell", "leather", "ascale", "cscale", "bfur", "pleather"];
	
	let settings =
		{
			"HomeMap": "main",
			"HomeCoords": {x: -118, y: 11},
			"MerchItems": merchantItems,
			"UpgradeList": upgradeList,
			"CompoundList": compoundList,
			"VendorTrash": vendorTrash,
			"PontyList": pontyList,
		};
	
	startBotCore(settings);
	startMerchantBot();
}