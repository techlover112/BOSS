import type { TaskPolicyLevel } from '@/constants';

type TaskLevel = TaskPolicyLevel;

export type PolicyList = {
	MajorVersion: number;
	MinorVersion: number;
	ListId: number;
	DefaultStop: boolean;
	ForceVersionUp: boolean;
	UpdateTime: string;
	Priority: {
		TitleId: string;
		TaskId: string;
		Level: TaskLevel;
		Persistent?: boolean;
		Revive?: boolean;
	}[];
};
