import { runAgentStep } from "./features/duels/runAgentStep";
import { watchForAgentStart } from "./features/duels/watchForAgentStart";
import { answerWorldReadRequests } from "./features/missions/answerWorldReadRequests";

void runAgentStep();
watchForAgentStart();
answerWorldReadRequests();
