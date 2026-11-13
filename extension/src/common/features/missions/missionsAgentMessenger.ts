import type { MissionsAgentMessage } from "@/common/features/missions/models/missionsState";
import { missionsAgentResponseValidator } from "@/common/features/missions/validators/missionsStateValidators";
import { sendRuntimeMessage } from "@/common/features/runtimeMessaging";

export const missionsAgentMessenger = {
	send: (message: MissionsAgentMessage) =>
		sendRuntimeMessage(message, missionsAgentResponseValidator),
};
