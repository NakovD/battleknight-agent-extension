import type { ReactNode } from "react";
import { Tab } from "@/popup/components/common/tabs/components/Tab";

interface TabsProps {
	children: ReactNode;
}

export const Tabs = ({ children }: TabsProps) => (
	<div className="flex flex-col w-full">{children}</div>
);

interface ITabPanelProps {
	id: string;
	activeTab: string;
	children: React.ReactNode;
}

const TabPanel = ({ id, activeTab, children }: ITabPanelProps) => {
	if (activeTab !== id) return null;

	return (
		<div role="tabpanel" id={`tabpanel-${id}`} className="w-full">
			{children}
		</div>
	);
};

interface ITabListProps {
	children: ReactNode;
}

const TabList = ({ children }: ITabListProps) => (
	<div className="relative flex border-b border-amber-900/30">{children}</div>
);

Tabs.Panel = TabPanel;
Tabs.List = TabList;
Tabs.Tab = Tab;
