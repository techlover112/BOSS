import { Command, Option } from 'commander';
import { getDefaultTaskPolicyLevel, getTaskPolicyLevelError, TASK_POLICY_LEVEL_METADATA_KEY, TASK_POLICY_LEVELS } from '../constants';
import { commandHandler, getCliContext } from './utils';
import { logOutputList, logOutputObject } from './output';

const listCmd = new Command('ls')
	.description('List all tasks in BOSS')
	.argument('<app_id>', 'BOSS app to search in')
	.action(commandHandler<[string]>(async (cmd): Promise<void> => {
		const [appId] = cmd.args;
		const ctx = getCliContext();
		const { tasks } = await ctx.grpc.listTasks({});
		const filteredTasks = tasks.filter(v => v.bossAppId === appId);
		logOutputList(filteredTasks, {
			format: cmd.format,
			mapping: {
				id: 'Task ID',
				description: 'Description',
				status: 'Status'
			},
			onlyIncludeKeys: ['id', 'description', 'status']
		});
	}));

const viewCmd = new Command('view')
	.description('Look up a specific task')
	.argument('<app_id>', 'BOSS app ID that contains the task')
	.argument('<id>', 'Task ID to lookup')
	.action(commandHandler<[string, string]>(async (cmd): Promise<void> => {
		const [appId, taskId] = cmd.args;
		const ctx = getCliContext();
		const { tasks } = await ctx.grpc.listTasks({});
		const task = tasks.find(v => v.bossAppId === appId && v.id === taskId);
		if (!task) {
			console.log(`Could not find task with ID ${taskId} in app ${appId}`);
			return;
		}
		logOutputObject({
			taskId: task.id,
			inGameId: task.inGameId,
			description: task.description,
			titleId: task.titleId.toString(16).toLowerCase().padStart(16, '0'),
			bossAppId: task.bossAppId,
			creatorPid: task.creatorPid,
			status: task.status,
			createdAt: new Date(Number(task.createdTimestamp)),
			updatedAt: new Date(Number(task.updatedTimestamp))
		}, {
			format: cmd.format
		});
	}));

const createCmd = new Command('create')
	.description('Create a new task')
	.argument('<app_id>', 'BOSS app to store the task in')
	.requiredOption('--id <id>', 'Id of the task')
	.requiredOption('--title-id <titleId>', 'Title ID for the task')
	.option('--status [status]', 'Initial status of the task')
	.option('--interval [interval]', 'Interval of the task')
	.option('--desc [desc]', 'Description of the task')
	.addOption(new Option('--priority <priority>', 'NPPL priority of the task. Any level except STOPPED for open tasks (default EXPEDITE), only STOPPED for closed tasks (default STOPPED)')
		.choices(TASK_POLICY_LEVELS)
		.argParser(value => value.toUpperCase()))
	.action(commandHandler<[string]>(async (cmd): Promise<void> => {
		const [appId] = cmd.args;
		const opts = cmd.opts<{ id: string; titleId: string; status?: string; interval?: string; desc?: string; priority?: string }>();
		const status = opts.status ?? 'open';
		const priority = opts.priority ?? getDefaultTaskPolicyLevel(status);
		const priorityError = getTaskPolicyLevelError(status, priority);
		if (priorityError) {
			console.error(priorityError);
			process.exit(1);
		}
		const ctx = getCliContext();
		const { task } = await ctx.grpc.registerTask({
			bossAppId: appId,
			id: opts.id,
			titleId: BigInt(parseInt(opts.titleId, 16)),
			status,
			interval: Number(opts.interval ?? 0),
			description: opts.desc ?? ''
		}, ctx.callOptions({ [TASK_POLICY_LEVEL_METADATA_KEY]: priority }));
		if (!task) {
			console.log(`Failed to create task!`);
			return;
		}
		console.log(`Created task with ID ${task.id} (NPPL priority ${priority})`);
	}));

const deleteCmd = new Command('delete')
	.description('Delete a task')
	.argument('<app_id>', 'BOSS app ID that contains the task')
	.argument('<id>', 'Task ID to delete')
	.action(commandHandler<[string, string]>(async (cmd): Promise<void> => {
		const [appId, taskId] = cmd.args;
		const ctx = getCliContext();
		await ctx.grpc.deleteTask({
			bossAppId: appId,
			id: taskId
		});
		console.log(`Deleted task with ID ${taskId}`);
	}));

export const taskCmd = new Command('task')
	.description('Manage all the tasks in BOSS')
	.addCommand(listCmd)
	.addCommand(createCmd)
	.addCommand(deleteCmd)
	.addCommand(viewCmd);
