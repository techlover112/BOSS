import { Status, ServerError } from 'nice-grpc';
import { getTask, reconcileTaskPolicyLists } from '@/database';
import { hasPermission } from '@/services/grpc/boss/v1/middleware/authentication-middleware';
import type { AuthenticationCallContextExt } from '@/services/grpc/boss/v1/middleware/authentication-middleware';
import type { CallContext } from 'nice-grpc';
import type { DeleteTaskRequest } from '@pretendonetwork/grpc/boss/delete_task';
import type { Empty } from '@pretendonetwork/grpc/google/protobuf/empty';

export async function deleteTask(request: DeleteTaskRequest, context: CallContext & AuthenticationCallContextExt): Promise<Empty> {
	if (!hasPermission(context, 'deleteBossTasks')) {
		throw new ServerError(Status.PERMISSION_DENIED, 'PNID not authorized to delete tasks');
	}

	const taskID = request.id.trim();
	const bossAppID = request.bossAppId.trim();

	if (!taskID) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'Missing task ID');
	}

	if (!bossAppID) {
		throw new ServerError(Status.INVALID_ARGUMENT, 'Missing BOSS app ID');
	}

	const task = await getTask(bossAppID, taskID);

	if (!task) {
		throw new ServerError(Status.INVALID_ARGUMENT, `Task ${taskID} not found for BOSS app ${bossAppID}`);
	}

	task.deleted = true;
	task.updated = BigInt(Date.now());

	await task.save();

	// * Tasks registered before tasks were added to the NPPL have no entry to remove
	if (task.policy_level) {
		try {
			await reconcileTaskPolicyLists(task);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			throw new ServerError(Status.INTERNAL, `Task ${taskID} was deleted, but its NPPL entry could not be updated: ${message}. The scheduled NPPL sync will correct the entry`);
		}
	}

	return {};
}
