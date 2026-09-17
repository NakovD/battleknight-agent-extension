import { useState } from "react";
import { Tabs } from "@/popup/components/common/tabs/Tabs";
import { Account } from "@/popup/features/account/Account";
import { Duels } from "@/popup/features/duels/Duels";

export default function App() {
	const [activeTab, setActiveTab] = useState("duels");

	return (
		<div className="p-11 min-w-2xl bg-gray-800">
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
						isActive={activeTab === "account"}
						id="account"
						label="Account"
						icon="♜"
						onClick={() => setActiveTab("account")}
					/>
				</Tabs.List>

				<Tabs.Panel activeTab={activeTab} id="duels">
					<Duels />
				</Tabs.Panel>
				<Tabs.Panel activeTab={activeTab} id="missions">
					su
				</Tabs.Panel>
				<Tabs.Panel activeTab={activeTab} id="account">
					<Account />
				</Tabs.Panel>
			</Tabs>
		</div>
	);
}
