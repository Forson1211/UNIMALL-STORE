import { supabase } from "@/integrations/supabase/client";

export interface SecurityConfig {
  sessionTimeoutEnabled: boolean;
  sessionTimeoutMinutes: number;
  loginAttemptLimitEnabled: boolean;
  maxFailedLoginAttempts: number;
  passwordUpdateEnabled: boolean;
  passwordMinLength: number;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  sessionTimeoutEnabled: true,
  sessionTimeoutMinutes: 30,
  loginAttemptLimitEnabled: true,
  maxFailedLoginAttempts: 5,
  passwordUpdateEnabled: true,
  passwordMinLength: 8,
};

type RpcError = { message: string } | null;
type RpcResult<T> = { data: T | null; error: RpcError };
type RpcCaller = <T>(name: string, args?: Record<string, unknown>) => Promise<RpcResult<T>>;

const callRpc = (supabase.rpc as unknown as RpcCaller);

type SecurityConfigPayload = {
  session_timeout_enabled?: boolean;
  session_timeout_minutes?: number;
  login_attempt_limit_enabled?: boolean;
  max_failed_login_attempts?: number;
  password_update_enabled?: boolean;
  password_min_length?: number;
};

export async function getSecurityConfig(): Promise<SecurityConfig> {
  const { data, error } = await callRpc<SecurityConfigPayload>("get_security_config");
  if (error) throw new Error(error.message);

  return {
    sessionTimeoutEnabled: Boolean(data?.session_timeout_enabled ?? DEFAULT_SECURITY_CONFIG.sessionTimeoutEnabled),
    sessionTimeoutMinutes: Number(data?.session_timeout_minutes ?? DEFAULT_SECURITY_CONFIG.sessionTimeoutMinutes),
    loginAttemptLimitEnabled: Boolean(data?.login_attempt_limit_enabled ?? DEFAULT_SECURITY_CONFIG.loginAttemptLimitEnabled),
    maxFailedLoginAttempts: Number(data?.max_failed_login_attempts ?? DEFAULT_SECURITY_CONFIG.maxFailedLoginAttempts),
    passwordUpdateEnabled: Boolean(data?.password_update_enabled ?? DEFAULT_SECURITY_CONFIG.passwordUpdateEnabled),
    passwordMinLength: Number(data?.password_min_length ?? DEFAULT_SECURITY_CONFIG.passwordMinLength),
  };
}

export async function checkLoginAllowed(email: string) {
  const { data, error } = await callRpc<{ allowed?: boolean; retry_after_seconds?: number }>("check_login_allowed", {
    _email: email.trim().toLowerCase(),
  });
  if (error) throw new Error(error.message);
  return {
    allowed: data?.allowed !== false,
    retryAfterSeconds: Number(data?.retry_after_seconds ?? 0),
  };
}

export async function recordLoginAttempt(email: string, succeeded: boolean) {
  const { error } = await callRpc<null>("record_login_attempt", {
    _email: email.trim().toLowerCase(),
    _succeeded: succeeded,
  });
  if (error) throw new Error(error.message);
}

export async function validatePasswordUpdate(passwordLength: number) {
  const { data, error } = await callRpc<{ allowed?: boolean; minimum_length?: number; message?: string | null }>("validate_password_update", {
    _password_length: passwordLength,
  });
  if (error) throw new Error(error.message);
  return {
    allowed: data?.allowed === true,
    minimumLength: Number(data?.minimum_length ?? DEFAULT_SECURITY_CONFIG.passwordMinLength),
    message: typeof data?.message === "string" ? data.message : null,
  };
}

export async function recordPasswordUpdate() {
  const { error } = await callRpc<null>("record_password_update", {});
  if (error) throw new Error(error.message);
}
