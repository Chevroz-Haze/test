export interface CodeBlueprint {
  id: string;
  filename: string;
  title: string;
  purpose: string;
  language: string;
  code: string;
}

export const STARTER_BLUEPRINTS: CodeBlueprint[] = [
  {
    id: 'server-page',
    filename: 'app/dashboard/page.tsx',
    title: 'Async Server Component Page',
    purpose: 'Fetches data directly on the server with zero client bundle overhead and passes serializable props to interactive islands.',
    language: 'tsx',
    code: `import { Suspense } from 'react';

async function getProjectMetrics() {
  // Server-side data fetch or database query
  return {
    activeUsers: 1284,
    avgResponseMs: 18.4,
    deploymentRegion: 'us-east1',
  };
}

export default async function DashboardPage() {
  const metrics = await getProjectMetrics();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Operations Overview
      </h1>
      <Suspense fallback={<div className="mt-6 h-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />}>
        <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <dt className="text-xs font-medium text-slate-500">Active Sessions</dt>
            <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums">
              {metrics.activeUsers.toLocaleString()}
            </dd>
          </div>
        </dl>
      </Suspense>
    </main>
  );
}`,
  },
  {
    id: 'api-route',
    filename: 'app/api/items/route.ts',
    title: 'Typed App Router Route Handler',
    purpose: 'Standard Web Request/Response API endpoint supporting GET query filtering and validated POST mutations.',
    language: 'ts',
    code: `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') ?? 'all';

  return NextResponse.json({
    ok: true,
    category,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body?.title || typeof body.title !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'Field "title" is required.' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { ok: true, id: crypto.randomUUID(), title: body.title.trim() },
    { status: 201 }
  );
}`,
  },
  {
    id: 'server-action',
    filename: 'app/actions.ts',
    title: 'React 19 Server Action with Revalidation',
    purpose: 'Handles form submissions and mutations directly from client or server components with automatic path cache revalidation.',
    language: 'ts',
    code: `'use server';

import { revalidatePath } from 'next/cache';

export interface ActionState {
  ok: boolean;
  message: string;
}

export async function createProjectResource(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const title = String(formData.get('title') ?? '').trim();

  if (title.length < 3) {
    return {
      ok: false,
      message: 'Resource title must be at least 3 characters.',
    };
  }

  // Persist record to database here
  revalidatePath('/');

  return {
    ok: true,
    message: \`Created resource "\${title}" successfully.\`,
  };
}`,
  },
  {
    id: 'custom-hook',
    filename: 'hooks/use-debounced-value.ts',
    title: 'Client State & Debounce Hook',
    purpose: 'Reusable client-side hook for throttling high-frequency search inputs and filter controls before querying endpoints.',
    language: 'ts',
    code: `import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}`,
  },
];
