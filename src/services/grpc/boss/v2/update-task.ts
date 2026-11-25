import { Status, ServerError } from 'nice-grpc';
import { getPolicyListMajorVersion, getTask, reconcileTaskPolicyLists } from '@/database';
import { getTaskPolicyLevelError, getUpdatedTaskPolicyLevel, TASK_POLICY_LEVEL_METADATA_KEY } from '@/constants';
import { hasPermission } from '@/services/grpc/boss/v2/middleware/authentication-middleware';
import type { AuthenticationCallContextExt } from '@/services/grpc/boss/v2/middleware/authentication-middleware';
import type { TaskPolicyLevel } from '@/constants';
import type { CallContext } from 'nice-grpc';
import type { UpdateTaskRequest } from '@pretendonetwork/grpc/boss/v2/update_task';
import type { Empty } from '@pretendonetwork/grpc/google/protobuf/empty';

export async function updateTask(request: UpdateTaskRequest, context: CallContext & AuthenticationCallContextExt): Promise<Empty> {
	if (!hasPermission(context, 'updateBossTasks')) {
		throw new ServerError(Status.PERMISSION_DENIED, 'PNID not authorized to update tasks');
	}

	const taskID = request.id.trim();
	const bossAppID = request.bossAppId.trim();
	const updateData = request.updateData;

	if (!taskID) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'Missing task ID');
	}

	if (!bossAppID) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'Missing BOSS app ID');
	}

	if (!updateData) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'Missing task update data');
	}

	const task = await getTask(bossAppID, taskID);

	if (!task) {
		throw new ServerError(Status.INVALID_ARGUMENT, `Task ${taskID} not found for BOSS app ${bossAppID}`);
	}

	if (updateData.status !== 'open' && updateData.status !== 'close') {
		throw new ServerError(Status.INVALID_ARGUMENT, `Status ${updateData.status} is invalid`);
	}

	const previous = { id: task.id, title_id: task.title_id };

	if (updateData.id) {
		task.id = updateData.id.slice(0, 7);
		task.in_game_id = updateData.id;
	}

	task.boss_app_id = updateData.bossAppId ? updateData.bossAppId : task.boss_app_id;
	task.title_id = updateData.titleId ? updateData.titleId.toString(16).toLowerCase().padStart(16, '0') : task.title_id;
	task.status = updateData.status ? updateData.status : task.status;
	task.interval = updateData.interval ? updateData.interval : task.interval;
	task.description = updateData.description ? updateData.description : task.description;
	task.updated = BigInt(Date.now());

	// * A priority can be sent the same way as for RegisterTask. Tasks registered before tasks were
	// * added to the NPPL have no priority, and only join the NPPL when an update asks for one
	const requestedPolicyLevel = context.metadata.get(TASK_POLICY_LEVEL_METADATA_KEY)?.trim().toUpperCase();
	const inPolicyLists = Boolean(task.policy_level || requestedPolicyLevel);

	if (inPolicyLists) {
		const policyLevel = (requestedPolicyLevel || getUpdatedTaskPolicyLevel(task.status, task.policy_level)) as TaskPolicyLevel;
		const policyLevelError = getTaskPolicyLevelError(task.status, policyLevel);

		if (policyLevelError) {
			throw new ServerError(Status.INVALID_ARGUMENT, policyLevelError);
		}

		if (getPolicyListMajorVersion(task.title_id) === null) {
			throw new ServerError(Status.INVALID_ARGUMENT, `Title ID ${task.title_id} is not a Wii U or 3DS title ID, so the task cannot stay in the NPPL`);
		}

		task.policy_level = policyLevel;
		task.title_id = task.title_id.toLowerCase().padStart(16, '0');
	}

	// * Like RegisterTask, refuse to give this task the same ID as another live task in the same BOSS app
	const existing = await getTask(task.boss_app_id, task.id);

	if (existing && !existing._id.equals(task._id)) {
		throw new ServerError(Status.ALREADY_EXISTS, `Task ${task.id} already exists for BOSS app ${task.boss_app_id}`);
	}

	await task.save();

	if (inPolicyLists) {
		try {
			await reconcileTaskPolicyLists(task, previous);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			throw new ServerError(Status.INTERNAL, `Task ${taskID} was updated, but its NPPL entry could not be: ${message}. The scheduled NPPL sync will correct the entry`);
		}
	}

	return {};
}
