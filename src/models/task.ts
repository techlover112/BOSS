import mongoose from 'mongoose';
import { TASK_POLICY_LEVELS } from '@/constants';
import type { ITask, ITaskMethods, TaskModel } from '@/types/mongoose/task';

const TaskSchema = new mongoose.Schema<ITask, TaskModel, ITaskMethods>({
	deleted: {
		type: Boolean,
		default: false
	},
	id: String,
	in_game_id: String,
	boss_app_id: String,
	creator_pid: Number,
	status: {
		type: String,
		required: true,
		enum: ['open', 'close']
	},
	interval: Number,
	policy_level: {
		type: String,
		enum: TASK_POLICY_LEVELS
	},
	title_id: String,
	description: String,
	created: BigInt,
	updated: BigInt
}, { id: false });

TaskSchema.index({ boss_app_id: 1, id: 1 });
TaskSchema.index({ title_id: 1, id: 1 });

export const Task = mongoose.model<ITask, TaskModel>('Task', TaskSchema);
