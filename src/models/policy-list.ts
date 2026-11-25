import mongoose from 'mongoose';
import type { IPolicyList, PolicyListModel } from '@/types/mongoose/policy-list';

const PolicyListSchema = new mongoose.Schema<IPolicyList, PolicyListModel>({
	country_code: { type: String, required: true, index: true },
	major_version: { type: Number, required: true },
	list_id: { type: Number, required: true },
	default_stop: { type: Boolean, default: false },
	force_version_up: { type: Boolean, default: false },
	priority: [{
		title_id: String,
		task_id: String,
		level: String,
		persistent: Boolean,
		revive: Boolean,
		task_managed: Boolean
	}],
	tasks_synced: { type: Boolean, default: false },
	updated: BigInt
}, { id: false });

PolicyListSchema.index({ country_code: 1, major_version: 1 }, { unique: true });
PolicyListSchema.index({ major_version: 1 });

export const PolicyList = mongoose.model<IPolicyList, PolicyListModel>('PolicyList', PolicyListSchema, 'policy-lists');
