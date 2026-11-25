import type { Model, HydratedDocument } from 'mongoose';

export interface IPolicyListPriority {
	title_id: string;
	task_id: string;
	level: string;
	persistent?: boolean;
	revive?: boolean;
	task_managed?: boolean; // * Set on entries that come from a task, see reconcilePolicyListKey
}

export interface IPolicyList {
	country_code: string;
	major_version: number;
	list_id: number;
	default_stop: boolean;
	force_version_up: boolean;
	priority: IPolicyListPriority[];
	tasks_synced?: boolean; // * Set once every registered task has been added, see syncPolicyListTasks
	updated: bigint;
}

export type PolicyListModel = Model<IPolicyList>;

export type HydratedPolicyListDocument = HydratedDocument<IPolicyList>;
