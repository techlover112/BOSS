import mongoose from 'mongoose';
import { CECData } from '@/models/cec-data';
import { CECSlot } from '@/models/cec-slot';
import { Task } from '@/models/task';
import { FileCTR } from '@/models/file-ctr';
import { FileWUP } from '@/models/file-wup';
import { PolicyList } from '@/models/policy-list';
import { config } from '@/config-manager';
import { getDefaultPolicyListPriority } from '@/policy-list-defaults';
import type { HydratedCECDataDocument } from '@/types/mongoose/cec-data';
import type { HydratedCECSlotDocument, ICECSlot } from '@/types/mongoose/cec-slot';
import type { HydratedTaskDocument, ITask } from '@/types/mongoose/task';
import type { HydratedFileCTRDocument, IFileCTR } from '@/types/mongoose/file-ctr';
import type { HydratedFileWUPDocument, IFileWUP } from '@/types/mongoose/file-wup';
import type { IPolicyList, IPolicyListPriority } from '@/types/mongoose/policy-list';

const connection_string: string = config.mongoose.connection_string;

let _connection: mongoose.Connection;

export async function connect(): Promise<void> {
	await mongoose.connect(connection_string);

	_connection = mongoose.connection;
	_connection.on('error', console.error.bind(console, 'connection error:'));
}

export function connection(): mongoose.Connection {
	return _connection;
}

export function verifyConnected(): void {
	if (!connection()) {
		throw new Error('Cannot make database requests without being connected');
	}
}

export function getAllTasks(allowDeleted: boolean): Promise<HydratedTaskDocument[]> {
	verifyConnected();

	const filter: mongoose.FilterQuery<ITask> = {};

	if (!allowDeleted) {
		filter.deleted = false;
	}

	return Task.find(filter);
}

export function getTask(bossAppID: string, taskID: string): Promise<HydratedTaskDocument | null> {
	verifyConnected();

	return Task.findOne<HydratedTaskDocument>({
		deleted: false,
		id: taskID.slice(0, 7),
		boss_app_id: bossAppID
	});
}

export function getCTRTaskFiles(allowDeleted: boolean, bossAppID: string, taskID: string, country?: string, language?: string, any: boolean = false): Promise<HydratedFileCTRDocument[]> {
	verifyConnected();

	const filter: mongoose.FilterQuery<IFileCTR> = {
		task_id: taskID.slice(0, 7),
		boss_app_id: bossAppID,
		$and: []
	};

	if (!allowDeleted) {
		filter.deleted = false;
	}

	if (country) {
		filter.$and?.push({
			$or: [
				{ supported_countries: { $eq: [] } },
				{ supported_countries: country }
			]
		});
	} else if (!any) {
		filter.$and?.push({
			supported_countries: { $eq: [] }
		});
	}

	if (language) {
		filter.$and?.push({
			$or: [
				{ supported_languages: { $eq: [] } },
				{ supported_languages: language }
			]
		});
	} else if (!any) {
		filter.$and?.push({
			supported_languages: { $eq: [] }
		});
	}

	if (filter.$and?.length === 0) {
		delete filter.$and;
	}

	return FileCTR.find(filter);
}

export function getWUPTaskFiles(allowDeleted: boolean, bossAppID: string, taskID: string, country?: string, language?: string, any: boolean = false): Promise<HydratedFileWUPDocument[]> {
	verifyConnected();

	const filter: mongoose.FilterQuery<IFileWUP> = {
		task_id: taskID.slice(0, 7),
		boss_app_id: bossAppID,
		$and: []
	};

	if (!allowDeleted) {
		filter.deleted = false;
	}

	if (country) {
		filter.$and?.push({
			$or: [
				{ supported_countries: { $eq: [] } },
				{ supported_countries: country }
			]
		});
	} else if (!any) {
		filter.$and?.push({
			supported_countries: { $eq: [] }
		});
	}

	if (language) {
		filter.$and?.push({
			$or: [
				{ supported_languages: { $eq: [] } },
				{ supported_languages: language }
			]
		});
	} else if (!any) {
		filter.$and?.push({
			supported_languages: { $eq: [] }
		});
	}

	if (filter.$and?.length === 0) {
		delete filter.$and;
	}

	return FileWUP.find(filter);
}

export function getCTRTaskFilesWithAttributes(allowDeleted: boolean, bossAppID: string, taskID: string, country?: string, language?: string, attribute1?: string, attribute2?: string, attribute3?: string): Promise<HydratedFileCTRDocument[]> {
	verifyConnected();

	const filter: mongoose.FilterQuery<IFileCTR> = {
		task_id: taskID.slice(0, 7),
		boss_app_id: bossAppID,
		$and: []
	};

	if (!allowDeleted) {
		filter.deleted = false;
	}

	if (country) {
		filter.$and?.push({
			$or: [
				{ supported_countries: { $eq: [] } },
				{ supported_countries: country }
			]
		});
	} else {
		filter.$and?.push({
			supported_countries: { $eq: [] }
		});
	}

	if (language) {
		filter.$and?.push({
			$or: [
				{ supported_languages: { $eq: [] } },
				{ supported_languages: language }
			]
		});
	} else {
		filter.$and?.push({
			supported_languages: { $eq: [] }
		});
	}

	if (attribute1) {
		filter['attributes.attribute1'] = attribute1;
	}

	if (attribute2) {
		filter['attributes.attribute2'] = attribute2;
	}

	if (attribute3) {
		filter['attributes.attribute3'] = attribute3;
	}

	if (filter.$and?.length === 0) {
		delete filter.$and;
	}

	return FileCTR.find(filter);
}

export function getCTRTaskFile(bossAppID: string, taskID: string, name: string, country?: string, language?: string): Promise<HydratedFileCTRDocument | null> {
	verifyConnected();

	const filter: mongoose.FilterQuery<IFileCTR> = {
		deleted: false,
		boss_app_id: bossAppID,
		task_id: taskID.slice(0, 7),
		name: name,
		$and: []
	};

	if (country) {
		filter.$and?.push({
			$or: [
				{ supported_countries: { $eq: [] } },
				{ supported_countries: country }
			]
		});
	} else {
		filter.$and?.push({
			supported_countries: { $eq: [] }
		});
	}

	if (language) {
		filter.$and?.push({
			$or: [
				{ supported_languages: { $eq: [] } },
				{ supported_languages: language }
			]
		});
	} else {
		filter.$and?.push({
			supported_languages: { $eq: [] }
		});
	}

	return FileCTR.findOne<HydratedFileCTRDocument>(filter);
}

export function getWUPTaskFile(bossAppID: string, taskID: string, name: string, country?: string, language?: string): Promise<HydratedFileWUPDocument | null> {
	verifyConnected();

	const filter: mongoose.FilterQuery<IFileWUP> = {
		deleted: false,
		boss_app_id: bossAppID,
		task_id: taskID.slice(0, 7),
		name: name,
		$and: []
	};

	if (country) {
		filter.$and?.push({
			$or: [
				{ supported_countries: { $eq: [] } },
				{ supported_countries: country }
			]
		});
	} else {
		filter.$and?.push({
			supported_countries: { $eq: [] }
		});
	}

	if (language) {
		filter.$and?.push({
			$or: [
				{ supported_languages: { $eq: [] } },
				{ supported_languages: language }
			]
		});
	} else {
		filter.$and?.push({
			supported_languages: { $eq: [] }
		});
	}

	return FileWUP.findOne<HydratedFileWUPDocument>(filter);
}

export function getCTRTaskFileBySerialNumber(serialNumber: bigint): Promise<HydratedFileCTRDocument | null> {
	verifyConnected();

	return FileCTR.findOne<HydratedFileCTRDocument>({
		deleted: false,
		serial_number: serialNumber
	});
}

export function getWUPTaskFileByDataID(dataID: bigint): Promise<HydratedFileWUPDocument | null> {
	verifyConnected();

	return FileWUP.findOne<HydratedFileWUPDocument>({
		deleted: false,
		data_id: Number(dataID)
	});
}

export function getDuplicateCECData(pid: number, gameID: number): Promise<HydratedCECDataDocument | null> {
	verifyConnected();

	return CECData.findOne<HydratedCECDataDocument>({
		creator_pid: pid,
		game_id: gameID
	});
}

export async function getRandomCECData(pids: number[], gameID: number): Promise<HydratedCECDataDocument | null> {
	verifyConnected();

	// * We search through the CECSlot so that everyone has the same chance of getting their data picked up
	const filter: mongoose.FilterQuery<ICECSlot> = {
		creator_pid: {
			$in: pids
		},
		game_id: gameID
	};

	const count = await CECSlot.countDocuments(filter);
	const rand = Math.floor(Math.random() * count);

	const cecSlot = await CECSlot.findOne<HydratedCECSlotDocument>(filter).skip(rand);

	if (cecSlot) {
		return CECData.findById(cecSlot.latest_data_id);
	}

	return null;
}

export async function deleteOldCECData(olderThan: Date, limit: number): Promise<{ id: string; file_key: string }[]> {
	verifyConnected();

	const toDelete = await CECData.find({
		created: {
			$lt: olderThan.getTime()
		}
	}).limit(limit).sort({ created: 1 }).select({ file_key: 1 });
	const ids = toDelete.map(v => v.id);

	await CECData.deleteMany({
		_id: {
			$in: ids
		}
	});

	// Remove slot if their newest data is what we've just deleted
	// This is safe because everything older than the deleted data is also gone
	await CECSlot.deleteMany({
		latest_data_id: {
			$in: ids
		}
	});

	return toDelete.map(v => ({ id: v.id, file_key: v.file_key }));
}

// * Wii U policy lists are major version 1, 3DS policy lists are major version 3.
// * Title IDs start with 0005 on the Wii U and 0004 on the 3DS
const POLICY_LIST_PLATFORMS = [
	{ majorVersion: 1, titleIDPrefix: '0005' },
	{ majorVersion: 3, titleIDPrefix: '0004' }
];

// * How the NPPL stays in line with tasks:
// * - Entries that come from tasks are marked task_managed. Entries without the mark (the built-in
// *   defaults, or anything added to a list by hand) are only ever replaced by a task with the same key
// * - An entry's key is the 16 character title ID plus the 7 character task ID, which is what consoles store
// * - reconcilePolicyListKey works out what a key should hold from the database alone: the most recently
// *   updated live task with that key, else the built-in default, else nothing. It is safe to run any
// *   number of times, so a write that fails part way is fixed by running it again
// * - Task writes reconcile the keys they touch, and reconcileAllPolicyLists runs on a schedule to
// *   repair anything a failed write left behind

export type PolicyListKey = { majorVersion: number; titleID: string; taskID: string };

export function getPolicyListMajorVersion(titleID: string): number | null {
	const prefix = titleID.toLowerCase().padStart(16, '0').slice(0, 4);

	return POLICY_LIST_PLATFORMS.find(platform => platform.titleIDPrefix === prefix)?.majorVersion ?? null;
}

export function getTaskPolicyListKey(task: Pick<ITask, 'title_id' | 'id'>): PolicyListKey | null {
	const majorVersion = getPolicyListMajorVersion(task.title_id);

	if (majorVersion === null) {
		return null;
	}

	return {
		majorVersion,
		titleID: task.title_id.toLowerCase().padStart(16, '0'),
		taskID: task.id
	};
}

function taskToPolicyListPriority(task: Pick<ITask, 'title_id' | 'id' | 'policy_level'>): IPolicyListPriority {
	const titleID = task.title_id.toLowerCase().padStart(16, '0');
	const majorVersion = getPolicyListMajorVersion(titleID);
	// * A task that takes over a built-in default entry keeps that entry's Persistent and Revive flags
	const fallback = majorVersion === null ? null : getDefaultPolicyListPriority(majorVersion, titleID, task.id);
	const entry: IPolicyListPriority = {
		title_id: titleID,
		// * Consoles store task IDs in 8 bytes including the NUL terminator, so policy lists use the 7 character server-side ID
		task_id: task.id,
		level: task.policy_level ?? 'EXPEDITE',
		task_managed: true
	};

	if (fallback?.persistent !== undefined) {
		entry.persistent = fallback.persistent;
	}

	if (fallback?.revive !== undefined) {
		entry.revive = fallback.revive;
	}

	return entry;
}

function liveTaskFilter(majorVersion: number): mongoose.FilterQuery<ITask> | null {
	const platform = POLICY_LIST_PLATFORMS.find(platform => platform.majorVersion === majorVersion);

	if (!platform) {
		return null;
	}

	return {
		deleted: false,
		policy_level: { $exists: true },
		title_id: { $regex: `^${platform.titleIDPrefix}` }
	};
}

/**
 * Gets the NPPL priority entries for every live task on the platform that `majorVersion` belongs to.
 * When several tasks share a key, the most recently updated one wins
 */
export async function getTaskPolicyListPriorities(majorVersion: number): Promise<IPolicyListPriority[]> {
	verifyConnected();

	const filter = liveTaskFilter(majorVersion);

	if (!filter) {
		return [];
	}

	const tasks = await Task.find(filter).sort({ updated: -1 });
	const priorities: IPolicyListPriority[] = [];

	for (const task of tasks) {
		const entry = taskToPolicyListPriority(task);

		if (!priorities.some(p => p.title_id === entry.title_id && p.task_id === entry.task_id)) {
			priorities.push(entry);
		}
	}

	return priorities;
}

/**
 * Makes one key hold what it should in every stored policy list of its platform
 */
export async function reconcilePolicyListKey(key: PolicyListKey): Promise<void> {
	verifyConnected();

	const task = await Task.findOne({
		deleted: false,
		policy_level: { $exists: true },
		id: key.taskID,
		title_id: key.titleID
	}).sort({ updated: -1 });

	if (task) {
		await setPolicyListPriority({ major_version: key.majorVersion }, taskToPolicyListPriority(task));
		return;
	}

	// * No live task wants this key, so only lists where a task put the current entry change
	const managedLists = await PolicyList.find({
		major_version: key.majorVersion,
		priority: { $elemMatch: { title_id: key.titleID, task_id: key.taskID, task_managed: true } }
	}).select({ _id: 1 });

	if (managedLists.length === 0) {
		return;
	}

	const filter = { _id: { $in: managedLists.map(list => list._id) } };
	const fallback = getDefaultPolicyListPriority(key.majorVersion, key.titleID, key.taskID);

	if (fallback) {
		await setPolicyListPriority(filter, fallback);
		return;
	}

	await PolicyList.updateMany(filter, {
		$pull: { priority: { title_id: key.titleID, task_id: key.taskID, task_managed: true } },
		$set: { updated: BigInt(Date.now()) }
	});
}

/**
 * Reconciles a task's key, and the key it had before an update if that was different
 */
export async function reconcileTaskPolicyLists(task: Pick<ITask, 'title_id' | 'id'>, previous?: Pick<ITask, 'title_id' | 'id'>): Promise<void> {
	const keys = [task, previous].map(t => t ? getTaskPolicyListKey(t) : null).filter((key): key is PolicyListKey => key !== null);
	const seen = new Set<string>();

	for (const key of keys) {
		const id = `${key.majorVersion}/${key.titleID}/${key.taskID}`;

		if (!seen.has(id)) {
			seen.add(id);
			await reconcilePolicyListKey(key);
		}
	}
}

/**
 * Reconciles every key that a live task wants or that a task entry holds, on every platform
 */
export async function reconcileAllPolicyLists(): Promise<number> {
	verifyConnected();

	let count = 0;

	for (const platform of POLICY_LIST_PLATFORMS) {
		const filter = liveTaskFilter(platform.majorVersion);
		const keys = new Map<string, PolicyListKey>();
		const addKey = (titleID: string, taskID: string): void => {
			keys.set(`${titleID}/${taskID}`, { majorVersion: platform.majorVersion, titleID: titleID.toLowerCase().padStart(16, '0'), taskID });
		};

		if (filter) {
			for (const task of await Task.find(filter).select({ title_id: 1, id: 1 })) {
				addKey(task.title_id, task.id);
			}
		}

		const managed = await PolicyList.aggregate<{ _id: { title_id: string; task_id: string } }>([
			{ $match: { major_version: platform.majorVersion } },
			{ $unwind: '$priority' },
			{ $match: { 'priority.task_managed': true } },
			{ $group: { _id: { title_id: '$priority.title_id', task_id: '$priority.task_id' } } }
		]);

		for (const entry of managed) {
			addKey(entry._id.title_id, entry._id.task_id);
		}

		for (const key of keys.values()) {
			await reconcilePolicyListKey(key);
			count++;
		}
	}

	return count;
}

/**
 * Adds any live task missing from a policy list, then marks the list as synced. A task registered
 * while the list was being created can miss both the list's starting snapshot and the task write's own
 * reconcile, which only updates lists that already exist. Running this after the list is stored closes
 * that gap. The list stays unsynced until this succeeds, so an error or restart part way through is retried
 */
export async function syncPolicyListTasks(countryCode: string, majorVersion: number): Promise<void> {
	verifyConnected();

	const filter = { country_code: countryCode, major_version: majorVersion };
	const policyList = await PolicyList.findOne(filter);

	if (!policyList) {
		return;
	}

	const taskPriorities = await getTaskPolicyListPriorities(majorVersion);
	// * setPolicyListPriority skips the list when it already holds the exact entry
	for (const entry of taskPriorities) {
		await setPolicyListPriority(filter, entry);
	}

	await PolicyList.updateOne(filter, { $set: { tasks_synced: true } });
}

/**
 * Puts `entry` in every policy list matching `filter`, replacing any existing entry for the same title and
 * task. Each list is rewritten in one atomic update, so a list never holds the key without an entry even
 * if this fails part way, and lists that already hold exactly this entry are left alone
 */
async function setPolicyListPriority(filter: mongoose.FilterQuery<IPolicyList>, entry: IPolicyListPriority): Promise<void> {
	// * Update pipelines are not cast by mongoose, so this is written as it is stored. Values go
	// * through $literal, so a string starting with $ is not read as a field path
	const stored: Record<string, unknown> = {
		title_id: entry.title_id,
		task_id: entry.task_id,
		level: entry.level
	};
	const exact: Record<string, unknown> = { ...stored };

	for (const field of ['persistent', 'revive'] as const) {
		if (entry[field] !== undefined && entry[field] !== null) {
			stored[field] = entry[field];
			exact[field] = entry[field];
		} else {
			exact[field] = { $exists: false };
		}
	}

	if (entry.task_managed) {
		stored.task_managed = true;
		exact.task_managed = true;
	} else {
		exact.task_managed = { $ne: true };
	}

	const isSameKey = {
		$and: [
			{ $eq: ['$$p.title_id', { $literal: entry.title_id }] },
			{ $eq: ['$$p.task_id', { $literal: entry.task_id }] }
		]
	};

	await PolicyList.updateMany({
		$and: [
			filter,
			{ priority: { $not: { $elemMatch: exact } } }
		]
	}, [{
		$set: {
			priority: {
				$concatArrays: [
					{ $filter: { input: { $ifNull: ['$priority', []] }, as: 'p', cond: { $not: [isSameKey] } } },
					[{ $literal: stored }]
				]
			},
			updated: mongoose.mongo.Long.fromBigInt(BigInt(Date.now()))
		}
	}]);
}
