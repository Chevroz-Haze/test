import {NextRequest, NextResponse} from 'next/server';

export interface StarterResourceItem {
  id: string;
  title: string;
  category: 'route' | 'component' | 'database' | 'deployment';
  owner: string;
  status: 'Active' | 'In Review' | 'Archived';
  updatedAt: string;
  requestsPerMin: number;
}

const initialItems: StarterResourceItem[] = [
  {
    id: 'res-101',
    title: 'Authentication Session Middleware',
    category: 'route',
    owner: 'Elena Rostova',
    status: 'Active',
    updatedAt: '2026-10-30 14:22',
    requestsPerMin: 1420,
  },
  {
    id: 'res-102',
    title: 'Responsive Data Grid Primitive',
    category: 'component',
    owner: 'Marcus Vance',
    status: 'Active',
    updatedAt: '2026-10-30 11:05',
    requestsPerMin: 890,
  },
  {
    id: 'res-103',
    title: 'Connection Pool & Query Helper',
    category: 'database',
    owner: 'Devon Brooks',
    status: 'In Review',
    updatedAt: '2026-10-29 19:40',
    requestsPerMin: 615,
  },
  {
    id: 'res-104',
    title: 'Standalone Docker Build Output',
    category: 'deployment',
    owner: 'Hannah Lin',
    status: 'Active',
    updatedAt: '2026-10-28 09:15',
    requestsPerMin: 310,
  },
  {
    id: 'res-105',
    title: 'Webhook Signature Verifier',
    category: 'route',
    owner: 'Elena Rostova',
    status: 'Archived',
    updatedAt: '2026-10-24 16:50',
    requestsPerMin: 45,
  },
];

// In-memory store for the starter API route demonstration
let store: StarterResourceItem[] = [...initialItems];

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const category = searchParams.get('category');

  const filtered =
    category && category !== 'all'
      ? store.filter((item) => item.category === category)
      : store;

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    count: filtered.length,
    items: filtered,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const owner = typeof body.owner === 'string' ? body.owner.trim() : 'Developer';
    const category = ['route', 'component', 'database', 'deployment'].includes(body.category)
      ? body.category
      : 'component';
    const status = ['Active', 'In Review', 'Archived'].includes(body.status)
      ? body.status
      : 'Active';

    if (!title) {
      return NextResponse.json(
        {ok: false, error: 'Resource title is required.'},
        {status: 400}
      );
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newItem: StarterResourceItem = {
      id: `res-${Math.floor(100 + Math.random() * 900)}`,
      title,
      category,
      owner: owner || 'Developer',
      status,
      updatedAt: formattedDate,
      requestsPerMin: Number(body.requestsPerMin) || 120,
    };

    store = [newItem, ...store];

    return NextResponse.json(
      {
        ok: true,
        timestamp: now.toISOString(),
        item: newItem,
        items: store,
      },
      {status: 201}
    );
  } catch {
    return NextResponse.json(
      {ok: false, error: 'Invalid JSON request body.'},
      {status: 400}
    );
  }
}

export async function DELETE(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const id = searchParams.get('id');

  if (id === 'reset') {
    store = [...initialItems];
    return NextResponse.json({
      ok: true,
      message: 'Starter dataset reset to default items.',
      items: store,
    });
  }

  if (!id) {
    return NextResponse.json(
      {ok: false, error: 'Missing resource id query parameter.'},
      {status: 400}
    );
  }

  store = store.filter((item) => item.id !== id);
  return NextResponse.json({
    ok: true,
    deletedId: id,
    items: store,
  });
}
