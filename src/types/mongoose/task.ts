import type { Model, HydratedDocument } from 'mongoose';
import type { TaskPolicyLevel } from '@/constants';

export interface ITask {
	deleted: boolean;
	id: string;
	in_game_id: string;
	boss_app_id: string;
	creator_pid: number;
	status: 'open' | 'close';
	interval: number;
	policy_level?: TaskPolicyLevel; // * Unset on tasks registered before tasks were added to the NPPL
	title_id: string;
	description: string;
	created: bigint;
	updated: bigint;
}

export interface ITaskMethods { }

interface ITaskQueryHelpers { }

export type TaskModel = Model<ITask, ITaskQueryHelpers, ITaskMethods>;

export type HydratedTaskDocument = HydratedDocument<ITask, ITaskMethods>;
