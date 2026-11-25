// * Shared between the server and the CLI. Keep this file free of imports
// * with side effects (config, database, etc.) so the CLI can bundle it.

export const VALID_FILE_NOTIFY_CONDITIONS = [
	'app', 'account', 'app,account'
];

/**
 * Lower-cases and zero-pads a hexadecimal title ID to 16 characters, or returns null if it is not one
 */
export function normalizeTitleID(titleID: string): string | null {
	const normalized = titleID.trim().toLowerCase().padStart(16, '0');

	return /^[0-9a-f]{16}$/.test(normalized) ? normalized : null;
}

// * From most to least urgent, as documented by 3dbrew (BOSS Services, PriorityLevel)
export const OPEN_TASK_POLICY_LEVELS = [
	'EXPEDITE1', 'EXPEDITE2', 'EXPEDITE3', 'EXPEDITE4', 'EXPEDITE5', 'EXPEDITE6', 'EXPEDITE7', 'EXPEDITE8',
	'EXPEDITE', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST',
	'LOWEST1', 'LOWEST2', 'LOWEST3', 'LOWEST4', 'LOWEST5', 'LOWEST6', 'LOWEST7', 'LOWEST8'
] as const;
export const CLOSED_TASK_POLICY_LEVELS = ['STOPPED'] as const;
export const TASK_POLICY_LEVELS = [...OPEN_TASK_POLICY_LEVELS, ...CLOSED_TASK_POLICY_LEVELS] as const;

export type TaskPolicyLevel = typeof TASK_POLICY_LEVELS[number];

// * RegisterTaskRequest has no priority field, so the requested NPPL
// * priority travels as gRPC call metadata instead
export const TASK_POLICY_LEVEL_METADATA_KEY = 'X-BOSS-Policy-Priority';

export function getDefaultTaskPolicyLevel(status: string): TaskPolicyLevel {
	return status === 'close' ? 'STOPPED' : 'EXPEDITE';
}

/**
 * Works out a task's NPPL priority after an update that did not ask for one. Keeps the current
 * priority while the new status still allows it, otherwise falls back to that status's default
 */
export function getUpdatedTaskPolicyLevel(status: string, current: string | undefined): TaskPolicyLevel {
	if (current && !getTaskPolicyLevelError(status, current)) {
		return current as TaskPolicyLevel;
	}

	return getDefaultTaskPolicyLevel(status);
}

/**
 * Returns an error message if `level` is not allowed for a task with `status`, otherwise null
 */
export function getTaskPolicyLevelError(status: string, level: string): string | null {
	const allowed: readonly string[] = status === 'close' ? CLOSED_TASK_POLICY_LEVELS : OPEN_TASK_POLICY_LEVELS;

	if (!allowed.includes(level)) {
		return `Priority ${level} is invalid for a task with status ${status}. Allowed: ${allowed.join(', ')}`;
	}

	return null;
}
