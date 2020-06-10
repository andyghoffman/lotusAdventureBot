load_code("BehaviourDefinition");
load_code("BotCharacter");
load_code("BotGroup");
load_code("StandardBotBehaviour");

load_code("RangerLogic");
load_code("functions");

let standardBehaviour = new StandardBotBehaviour();

let testGroup = new BotGroup(["RangerLotus"], standardBehaviour);

testGroup.startGroup();