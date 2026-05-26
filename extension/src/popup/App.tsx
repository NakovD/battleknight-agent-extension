import { useState } from "react";
import { Tabs } from "@/popup/components/common/tabs/Tabs";
import { Duels } from "@/popup/features/duels/Duels";

export default function App() {
	const [activeTab, setActiveTab] = useState("duels");

	return (
		<div className="p-11 min-w-3xl bg-gray-800">
			<Tabs>
				<Tabs.List>
					<Tabs.Tab
						isActive={activeTab === "duels"}
						id="duels"
						label="Duels"
						icon="⚔"
						onClick={() => setActiveTab("duels")}
					/>
					<Tabs.Tab
						isActive={activeTab === "missions"}
						id="missions"
						label="Missions"
						icon="⚑"
						onClick={() => setActiveTab("missions")}
					/>
					<Tabs.Tab
						isActive={activeTab === "settings"}
						id="settings"
						label="Settings"
						icon="⚙"
						disabled
						onClick={() => setActiveTab("settings")}
					/>
				</Tabs.List>

				<Tabs.Panel activeTab={activeTab} id="duels">
					<Duels />
				</Tabs.Panel>
				<Tabs.Panel activeTab={activeTab} id="missions">
					su
				</Tabs.Panel>
				<Tabs.Panel activeTab={activeTab} id="settings">
					settings
				</Tabs.Panel>
			</Tabs>
		</div>
	);
}
