// HiraLearn — Push notification sender (FCM HTTP v1)
//
// Invoked from the admin Push page with the admin's user JWT. We:
//   1. Verify the caller is an admin (via the JWT + RLS).
//   2. Resolve the audience -> push tokens (admin_resolve_push_audience RPC).
//   3. Send via FCM HTTP v1 using a service-account-signed access token.
//   4. Record the result via admin_record_notification (also marks invalid tokens inactive).
//
// Required Supabase secrets (server-only):
//   SUPABASE_URL                — provided automatically
//   SUPABASE_SERVICE_ROLE_KEY   — provided automatically (used after caller verification)
//   FCM_SERVICE_ACCOUNT_JSON    — full service account JSON, single line, set with `supabase secrets set`
//
// If FCM_SERVICE_ACCOUNT_JSON is not set, the function records the notification with
// `failed_count = audience size` and a clear error so admins know FCM isn't wired up yet.

// @ts-expect-error -- Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error -- Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

declare const Deno: { env: { get(key: string): string | undefined } };

interface SendPushPayload {
  title: string;
  body: string;
  link?: string;
  audience: { type: 'all' | 'plan' | 'role' | 'user'; value?: string };
}

interface AudienceRow {
  user_id: string;
  token: string;
  platform: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// ---------------- FCM service-account access token (HTTP v1) ----------------

function base64UrlEncode(input: ArrayBuffer | string): string {
  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = new Uint8Array(input);
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getFcmAccessToken(serviceAccountJson: string): Promise<{
  token: string;
  projectId: string;
}> {
  const sa = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
    project_id: string;
    token_uri?: string;
  };
  const tokenUri = sa.token_uri ?? 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const claimsB64 = base64UrlEncode(JSON.stringify(claims));
  const unsigned = `${headerB64}.${claimsB64}`;

  const keyData = pemToArrayBuffer(sa.private_key);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${base64UrlEncode(sig)}`;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to mint FCM token: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return { token: data.access_token, projectId: sa.project_id };
}

async function sendOne(
  accessToken: string,
  projectId: string,
  payload: SendPushPayload,
  token: string,
): Promise<{ ok: boolean; invalid: boolean; error?: string }> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const body = {
    message: {
      token,
      notification: { title: payload.title, body: payload.body },
      webpush: payload.link
        ? { fcm_options: { link: payload.link } }
        : undefined,
      data: payload.link ? { link: payload.link } : undefined,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (res.ok) return { ok: true, invalid: false };
  const errText = await res.text();
  // Treat NOT_FOUND / INVALID_ARGUMENT / UNREGISTERED as invalid token
  const invalid =
    /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT|registration-token-not-registered/i.test(
      errText,
    );
  return { ok: false, invalid, error: errText.slice(0, 500) };
}

// ----------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const fcmJson = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing' });
  }

  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return json(401, { error: 'missing bearer token' });
  }

  // 1) Verify caller is admin via RPC executed under their JWT.
  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let payload: SendPushPayload;
  try {
    payload = (await req.json()) as SendPushPayload;
  } catch (_e) {
    return json(400, { error: 'invalid JSON' });
  }
  if (!payload?.title || !payload?.body || !payload?.audience?.type) {
    return json(400, { error: 'title, body, audience.type required' });
  }

  // 2) Resolve audience under caller JWT (RPC checks admin role).
  const audRes = await callerClient.rpc('admin_resolve_push_audience', {
    p_audience: payload.audience as unknown as Record<string, unknown>,
  });
  if (audRes.error) {
    return json(403, { error: audRes.error.message });
  }
  const tokens = (audRes.data ?? []) as AudienceRow[];

  if (tokens.length === 0) {
    return json(200, {
      audience_size: 0,
      sent: 0,
      failed: 0,
      invalid_tokens: 0,
      error: 'no_active_tokens',
    });
  }

  // 3) Send via FCM
  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  if (!fcmJson) {
    // FCM not configured — record the attempt with a clear failure so the UI shows the issue.
    failed = tokens.length;
    const recRes = await callerClient.rpc('admin_record_notification', {
      p_title: payload.title,
      p_body: payload.body,
      p_link: payload.link ?? null,
      p_audience: payload.audience as unknown as Record<string, unknown>,
      p_sent_count: 0,
      p_failed_count: failed,
      p_invalid_tokens: [] as string[],
    });
    return json(503, {
      error:
        'FCM not configured: set FCM_SERVICE_ACCOUNT_JSON via `supabase secrets set FCM_SERVICE_ACCOUNT_JSON=...`',
      audience_size: tokens.length,
      sent: 0,
      failed,
      invalid_tokens: 0,
      record_id: (recRes.data as { id?: string } | null)?.id ?? null,
    });
  }

  let accessToken: string;
  let projectId: string;
  try {
    const t = await getFcmAccessToken(fcmJson);
    accessToken = t.token;
    projectId = t.projectId;
  } catch (e) {
    return json(500, { error: `FCM auth failed: ${(e as Error).message}` });
  }

  // Send in small parallel batches to avoid overwhelming FCM
  const batchSize = 25;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const slice = tokens.slice(i, i + batchSize);
    const results = await Promise.all(
      slice.map((t) => sendOne(accessToken, projectId, payload, t.token)),
    );
    results.forEach((r, idx) => {
      if (r.ok) sent += 1;
      else {
        failed += 1;
        if (r.invalid) invalidTokens.push(slice[idx].token);
      }
    });
  }

  // 4) Record + mark invalid tokens inactive
  const recRes = await callerClient.rpc('admin_record_notification', {
    p_title: payload.title,
    p_body: payload.body,
    p_link: payload.link ?? null,
    p_audience: payload.audience as unknown as Record<string, unknown>,
    p_sent_count: sent,
    p_failed_count: failed,
    p_invalid_tokens: invalidTokens,
  });
  if (recRes.error) {
    return json(500, { error: recRes.error.message, sent, failed, invalidTokens });
  }

  return json(200, {
    audience_size: tokens.length,
    sent,
    failed,
    invalid_tokens: invalidTokens.length,
    record_id: (recRes.data as { id?: string } | null)?.id ?? null,
  });
});
