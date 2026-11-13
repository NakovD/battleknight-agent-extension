import { runAgentStep } from "./features/duels/runAgentStep";
import { watchForAgentStart } from "./features/duels/watchForAgentStart";
import { answerWorldReadRequests } from "./features/missions/answerWorldReadRequests";
import { runMissionStep } from "./features/missions/runMissionStep";
import { watchForMissionsStart } from "./features/missions/watchForMissionsStart";

void runAgentStep();
watchForAgentStart();
answerWorldReadRequests();

void runMissionStep();
watchForMissionsStart();
