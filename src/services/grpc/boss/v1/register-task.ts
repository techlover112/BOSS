import { ServerError, Status } from 'nice-grpc';
import { getPolicyListMajorVersion, getTask, reconcileTaskPolicyLists } from '@/database';
import { getDefaultTaskPolicyLevel, getTaskPolicyLevelError, normalizeTitleID, TASK_POLICY_LEVEL_METADATA_KEY } from '@/constants';
import { Task } from '@/models/task';
import { hasPermission } from '@/services/grpc/boss/v1/middleware/authentication-middleware';
import type { TaskPolicyLevel } from '@/constants';
import type { AuthenticationCallContextExt } from '@/services/grpc/boss/v1/middleware/authentication-middleware';
import type { CallContext } from 'nice-grpc';
import type { RegisterTaskRequest, RegisterTaskResponse } from '@pretendonetwork/grpc/boss/register_task';

const BOSS_APP_ID_FILTER_REGEX = /^[A-Za-z0-9]*$/;

export async function registerTask(request: RegisterTaskRequest, context: CallContext & AuthenticationCallContextExt): Promise<RegisterTaskResponse> {
	if (!hasPermission(context, 'createBossTasks')) {
		throw new ServerError(Status.PERMISSION_DENIED, 'PNID not authorized to register new tasks');
	}

	const taskID = request.id.trim();
	const bossAppID = request.bossAppId.trim();
	const titleID = normalizeTitleID(request.titleId);
	const description = request.description.trim();

	if (!taskID) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'Missing task ID');
	}

	if (!bossAppID) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'Missing BOSS app ID');
	}

	if (bossAppID.length !== 16) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'BOSS app ID must be 16 characters');
	}

	if (!BOSS_APP_ID_FILTER_REGEX.test(bossAppID)) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'BOSS app ID must only contain letters and numbers');
	}

	if (!request.titleId.trim()) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'Missing title ID');
	}

	if (!titleID) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'Title ID must be up to 16 hexadecimal characters');
	}

	if (await getTask(bossAppID, taskID)) {
		throw new ServerError(Status.ALREADY_EXISTS, `Task ${taskID} already exists for BOSS app ${bossAppID}`);
	}

	const requestedPolicyLevel = context.metadata.get(TASK_POLICY_LEVEL_METADATA_KEY)?.trim().toUpperCase();
	const policyLevel = (requestedPolicyLevel || getDefaultTaskPolicyLevel('open')) as TaskPolicyLevel;
	const policyLevelError = getTaskPolicyLevelError('open', policyLevel);

	if (policyLevelError) {
		throw new ServerError(Status.INVALID_ARGUMENT, policyLevelError);
	}

	if (getPolicyListMajorVersion(titleID) === null) {
		throw new ServerError(Status.INVALID_ARGUMENT, `Title ID ${titleID} is not a Wii U or 3DS title ID, so the task cannot be added to the NPPL`);
	}

	// * BOSS tasks have 2 IDs
	// * - 1: The ID which is registered in-game
	// * - 2: The ID which is registered on the server
	// * The in-game task ID can be any length, but the
	// * ID registered on the server is capped at 7 characters.
	// * When querying tasks in the API, the server ignores
	// * all characters after the 7th. For example, Splatoon
	// * registers task optdata2 in-game, but the server
	// * tracks it as task optdata

	const task = await Task.create({
		id: taskID.slice(0, 7),
		in_game_id: taskID,
		boss_app_id: bossAppID,
		creator_pid: context.user?.pid,
		status: 'open',
		policy_level: policyLevel,
		title_id: titleID,
		description: description,
		created: Date.now(),
		updated: Date.now()
	});

	try {
		await reconcileTaskPolicyLists(task);
	} catch (error) {
		// * Don't leave behind a task that the NPPL doesn't know about. Reconciling again once the task
		// * is gone puts back the key's built-in default, or removes the entry (if this fails too, the
		// * scheduled sync will). An entry added or edited by hand that the task replaced is not restored
		const message = error instanceof Error ? error.message : 'Unknown error';
		let removed = true;

		await task.deleteOne().catch(() => {
			removed = false;
		});

		if (removed) {
			await reconcileTaskPolicyLists(task).catch(() => {});
			throw new ServerError(Status.INTERNAL, `Failed to add task ${taskID} to the NPPL, so it was not registered: ${message}`);
		}

		throw new ServerError(Status.INTERNAL, `Failed to add task ${taskID} to the NPPL: ${message}. The task could not be removed again, so it may still exist; the scheduled NPPL sync will add it to the NPPL`);
	}

	return {
		task: {
			deleted: task.deleted,
			id: task.id,
			inGameId: task.in_game_id,
			bossAppId: task.boss_app_id,
			creatorPid: task.creator_pid,
			status: task.status,
			titleId: task.title_id,
			description: task.description,
			createdTimestamp: task.created,
			updatedTimestamp: task.updated
		}
	};
}
