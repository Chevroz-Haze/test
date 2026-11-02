'use client';

import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Sun,
  Moon,
  Send,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import {STARTER_BLUEPRINTS} from '@/lib/starter-blueprints';
import type {StarterResourceItem} from '@/app/api/items/route';

type CategoryFilter = 'all' | 'route' | 'component' | 'database' | 'deployment';

interface ApiLogEntry {
  id: string;
  method: 'GET' | 'POST' | 'DELETE';
  endpoint: string;
  status: number;
  durationMs: number;
  timestamp: string;
  responsePreview: string;
}

export default function StarterWorkspacePage() {
  // Theme state synced with document.documentElement
  const [isDark, setIsDark] = useState(false);

  // Navigation section focus
  const [activeBlueprintId, setActiveBlueprintId] = useState<string>(
    STARTER_BLUEPRINTS[0].id
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // CRUD Resource State wired to /api/items
  const [items, setItems] = useState<StarterResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Create Resource Modal / Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newOwner, setNewOwner] = useState<string>('Alex Rivera');
  const [newCategory, setNewCategory] =
    useState<StarterResourceItem['category']>('component');
  const [newStatus, setNewStatus] =
    useState<StarterResourceItem['status']>('Active');
  const [newRpm, setNewRpm] = useState<string>('240');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // API Inspector State
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [inspectorCategory, setInspectorCategory] = useState<string>('all');
  const [activeLogId, setActiveLogId] = useState<string | null>(null);

  // UI Primitives Playground State
  const [primitiveToast, setPrimitiveToast] = useState<{
    tone: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);
  const [primitiveSwitch, setPrimitiveSwitch] = useState<boolean>(true);
  const [primitiveThreshold, setPrimitiveThreshold] = useState<number>(75);
  const [primitiveEnv, setPrimitiveEnv] = useState<'development' | 'staging' | 'production'>('development');

  // Toggle dark mode on <html>
  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const recordApiLog = useCallback(
    (
      method: 'GET' | 'POST' | 'DELETE',
      endpoint: string,
      status: number,
      durationMs: number,
      payload: unknown
    ) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const entry: ApiLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        method,
        endpoint,
        status,
        durationMs,
        timestamp: timeStr,
        responsePreview: JSON.stringify(payload, null, 2),
      };
      setApiLogs((prev) => [entry, ...prev.slice(0, 9)]);
      setActiveLogId(entry.id);
    },
    []
  );

  const fetchItems = useCallback(
    async (categoryParam: string = 'all') => {
      setIsLoading(true);
      const start = performance.now();
      const url =
        categoryParam === 'all'
          ? '/api/items'
          : `/api/items?category=${encodeURIComponent(categoryParam)}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const elapsed = Math.round(performance.now() - start);
        if (Array.isArray(data.items)) {
          setItems(data.items);
        }
        recordApiLog('GET', url, res.status, elapsed, data);
      } catch (err) {
        recordApiLog('GET', url, 500, 0, {
          error: err instanceof Error ? err.message : 'Request failed',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [recordApiLog]
  );

  useEffect(() => {
    fetchItems('all');
  }, [fetchItems]);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newTitle.trim().length < 3) {
      setFormError('Please enter a resource title with at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: newTitle.trim(),
          owner: newOwner.trim() || 'Developer',
          category: newCategory,
          status: newStatus,
          requestsPerMin: Number(newRpm) || 120,
        }),
      });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      recordApiLog('POST', '/api/items', res.status, elapsed, data);

      if (!res.ok) {
        setFormError(data.error || 'Could not create resource.');
      } else {
        if (Array.isArray(data.items)) {
          setItems(data.items);
        }
        setNewTitle('');
        setIsCreateOpen(false);
        setPrimitiveToast({
          tone: 'success',
          text: `Created "${data.item?.title || newTitle}" via POST /api/items`,
        });
      }
    } catch {
      setFormError('Network error while communicating with /api/items.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (id: string, title: string) => {
    const start = performance.now();
    const endpoint = `/api/items?id=${encodeURIComponent(id)}`;
    try {
      const res = await fetch(endpoint, {method: 'DELETE'});
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      recordApiLog('DELETE', endpoint, res.status, elapsed, data);
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
      setPrimitiveToast({
        tone: 'warning',
        text: `Removed "${title}" (${id})`,
      });
    } catch {
      setPrimitiveToast({
        tone: 'error',
        text: 'Failed to delete item.',
      });
    }
  };

  const handleResetDataset = async () => {
    const start = performance.now();
    const endpoint = '/api/items?id=reset';
    setIsLoading(true);
    try {
      const res = await fetch(endpoint, {method: 'DELETE'});
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      recordApiLog('DELETE', endpoint, res.status, elapsed, data);
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
      setCategoryFilter('all');
      setSearchQuery('');
      setPrimitiveToast({
        tone: 'success',
        text: 'Starter dataset restored to default records.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = items.filter((item) => {
      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    return [...list].sort((a, b) =>
      sortAsc
        ? a.requestsPerMin - b.requestsPerMin
        : b.requestsPerMin - a.requestsPerMin
    );
  }, [items, categoryFilter, searchQuery, sortAsc]);

  const activeBlueprint = useMemo(
    () =>
      STARTER_BLUEPRINTS.find((b) => b.id === activeBlueprintId) ||
      STARTER_BLUEPRINTS[0],
    [activeBlueprintId]
  );

  const selectedLog = useMemo(
    () => apiLogs.find((l) => l.id === activeLogId) || apiLogs[0] || null,
    [apiLogs, activeLogId]
  );

  const totalThroughput = useMemo(
    () => items.reduce((acc, item) => acc + item.requestsPerMin, 0),
    [items]
  );

  const activeCount = useMemo(
    () => items.filter((i) => i.status === 'Active').length,
    [items]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#overview"
          style={{fontFamily: 'var(--font-display), sans-serif'}}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          Foundry
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <a
            href="#overview"
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Overview
          </a>
          <a
            href="#crud-sandbox"
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            CRUD Sandbox
          </a>
          <a
            href="#api-inspector"
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            API Inspector
          </a>
          <a
            href="#ui-primitives"
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            UI Primitives
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Resource
          </button>
        </div>
      </header>

      {/* Main Content Container (1440px baseline, max-w-7xl) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Workspace Utility Strip & Overview Hero */}
        <section id="overview" className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Next.js 15 App Router</span>
                <span aria-hidden="true">·</span>
                <span>React 19</span>
                <span aria-hidden="true">·</span>
                <span>TypeScript Strict</span>
                <span aria-hidden="true">·</span>
                <span>Tailwind CSS v4</span>
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-display), sans-serif',
                  textWrap: 'balance',
                }}
                className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
              >
                Full-Stack Next.js Starter Workspace
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                A clean foundation pre-wired with typed App Router API route
                handlers, client-to-server CRUD mutations, copyable code
                blueprints, and dual-theme UI primitives.
              </p>
            </div>

            {/* Workspace Toolbar Controls (Placed in Hero/Workspace Toolbar per Top Bar Contract) */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Theme</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-600" />
                    <span>Dark Theme</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => fetchItems(categoryFilter)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync API State</span>
              </button>

              <button
                type="button"
                onClick={handleResetDataset}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>

          {/* 4-Column Metric Strip with Tabular Numerals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Registered Modules
              </div>
              <div
                style={{fontFamily: 'var(--font-mono), monospace'}}
                className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
              >
                {items.length}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {activeCount} active in production
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Simulated Throughput
              </div>
              <div
                style={{fontFamily: 'var(--font-mono), monospace'}}
                className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
              >
                {totalThroughput.toLocaleString()} req/m
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Aggregated across active routes
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                API Route Requests Logged
              </div>
              <div
                style={{fontFamily: 'var(--font-mono), monospace'}}
                className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
              >
                {apiLogs.length}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Last status: {apiLogs[0] ? `${apiLogs[0].status} OK` : 'Ready'}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Starter Blueprints
              </div>
              <div
                style={{fontFamily: 'var(--font-mono), monospace'}}
                className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
              >
                {STARTER_BLUEPRINTS.length} templates
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Server Pages · Route Handlers · Actions
              </div>
            </div>
          </div>
        </section>

        {/* Live Notification Banner if triggered */}
        {primitiveToast && (
          <div
            role="status"
            className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-3 text-sm">
              {primitiveToast.tone === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              {primitiveToast.tone === 'warning' && (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              {primitiveToast.tone === 'error' && (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {primitiveToast.tone === 'success'
                  ? 'Success:'
                  : primitiveToast.tone === 'warning'
                    ? 'Notice:'
                    : 'Error:'}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {primitiveToast.text}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPrimitiveToast(null)}
              aria-label="Dismiss notification"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section 1: Interactive CRUD Sandbox wired to /app/api/items/route.ts */}
        <section id="crud-sandbox" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2
                style={{fontFamily: 'var(--font-display), sans-serif'}}
                className="text-xl font-bold text-slate-900 dark:text-slate-100"
              >
                01. Live Resource Registry & CRUD Data Grid
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Backed by <code className="font-mono text-xs">/api/items</code>.
                Filter by category, search records, or add new modules to test
                full-stack state updates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Module</span>
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            {/* Interactive Segmented Filter Controls */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
              {(
                [
                  {key: 'all', label: 'All Modules'},
                  {key: 'route', label: 'API Routes'},
                  {key: 'component', label: 'Components'},
                  {key: 'database', label: 'Database'},
                  {key: 'deployment', label: 'Deployment'},
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCategoryFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === tab.key
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Client Search & Sort */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, owner, or ID..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setSortAsc((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Throughput {sortAsc ? '↑' : '↓'}</span>
              </button>
            </div>
          </div>

          {/* High-Density Data Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4">ID</th>
                    <th className="py-2.5 px-4">Module Title</th>
                    <th className="py-2.5 px-4">Category · Owner</th>
                    <th className="py-2.5 px-4">Operational State</th>
                    <th className="py-2.5 px-4 text-right">Throughput</th>
                    <th className="py-2.5 px-4 text-right">Updated</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {isLoading ? (
                    Array.from({length: 4}).map((_, idx) => (
                      <tr key={idx} className="h-11">
                        <td colSpan={7} className="px-4 py-2.5">
                          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 px-6 text-center">
                        <div className="max-w-sm mx-auto space-y-3">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            No matching starter modules found
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Once modules are created or filters are cleared,
                            their route metadata and throughput metrics appear
                            here.
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryFilter('all');
                                setSearchQuery('');
                              }}
                              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Clear Filters
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCreateOpen(true)}
                              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Log First Entry
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="h-11 hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td
                          style={{fontFamily: 'var(--font-mono), monospace'}}
                          className="py-2.5 px-4 text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap"
                        >
                          {item.id}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {item.title}
                        </td>
                        {/* Unboxed metadata with middle-dot separator (Zero-Pill Discipline) */}
                        <td className="py-2.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <span className="capitalize">{item.category}</span>
                          <span aria-hidden="true" className="mx-1.5">
                            ·
                          </span>
                          <span>{item.owner}</span>
                        </td>
                        <td className="py-2.5 px-4 text-xs whitespace-nowrap">
                          <span
                            className={
                              item.status === 'Active'
                                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                                : item.status === 'In Review'
                                  ? 'text-amber-700 dark:text-amber-400 font-medium'
                                  : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            {item.status}
                          </span>
                        </td>
                        <td
                          style={{fontFamily: 'var(--font-mono), monospace'}}
                          className="py-2.5 px-4 text-xs text-right text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap"
                        >
                          {item.requestsPerMin.toLocaleString()} req/m
                        </td>
                        <td
                          style={{fontFamily: 'var(--font-mono), monospace'}}
                          className="py-2.5 px-4 text-xs text-right text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap"
                        >
                          {item.updatedAt}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteResource(item.id, item.title)
                            }
                            aria-label={`Delete ${item.title}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 2: Next.js Route Handler Inspector & Blueprint Library */}
        <section
          id="api-inspector"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-slate-200 dark:border-slate-800 items-stretch"
        >
          {/* Left 5 Columns: Live Route Handler Tester & Telemetry Log */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h2
                style={{fontFamily: 'var(--font-display), sans-serif'}}
                className="text-xl font-bold text-slate-900 dark:text-slate-100"
              >
                02. App Router API Inspector
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Dispatch real requests to{' '}
                <code className="font-mono text-xs">/api/items</code> and
                inspect the JSON payload and response timing.
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4">
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Query Parameter (<code className="font-mono">?category=</code>
                  )
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={inspectorCategory}
                    onChange={(e) => setInspectorCategory(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">all (unfiltered)</option>
                    <option value="route">route</option>
                    <option value="component">component</option>
                    <option value="database">database</option>
                    <option value="deployment">deployment</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => fetchItems(inspectorCategory)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send GET</span>
                  </button>
                </div>
              </div>

              {/* Recent Request Log List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Recent HTTP Calls</span>
                  <span className="font-mono tabular-nums">
                    {apiLogs.length} recorded
                  </span>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md max-h-44 overflow-y-auto">
                  {apiLogs.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">
                      No requests sent yet.
                    </div>
                  ) : (
                    apiLogs.map((log) => (
                      <button
                        key={log.id}
                        type="button"
                        onClick={() => setActiveLogId(log.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                          selectedLog?.id === log.id
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div
                          style={{fontFamily: 'var(--font-mono), monospace'}}
                          className="truncate pr-2"
                        >
                          <span className="font-semibold">{log.method}</span>{' '}
                          <span>{log.endpoint}</span>
                        </div>
                        <div
                          style={{fontFamily: 'var(--font-mono), monospace'}}
                          className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0"
                        >
                          {log.status} · {log.durationMs}ms
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* JSON Payload Viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Response JSON Payload</span>
                  {selectedLog && (
                    <span
                      style={{fontFamily: 'var(--font-mono), monospace'}}
                      className="tabular-nums"
                    >
                      {selectedLog.timestamp}
                    </span>
                  )}
                </div>
                <pre
                  style={{fontFamily: 'var(--font-mono), monospace'}}
                  className="p-3 text-xs bg-slate-950 text-slate-100 rounded-md overflow-x-auto max-h-48 leading-relaxed"
                >
                  {selectedLog
                    ? selectedLog.responsePreview
                    : '// Click "Send GET" to inspect live response'}
                </pre>
              </div>
            </div>
          </div>

          {/* Right 7 Columns: Copyable Next.js 15 Starter Blueprints */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h2
                style={{fontFamily: 'var(--font-display), sans-serif'}}
                className="text-xl font-bold text-slate-900 dark:text-slate-100"
              >
                03. Starter Code Blueprints
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ready-to-copy patterns for Server Components, Route Handlers,
                React 19 Server Actions, and custom hooks.
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4">
              {/* Blueprint Selector Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
                {STARTER_BLUEPRINTS.map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => setActiveBlueprintId(bp.id)}
                    style={{fontFamily: 'var(--font-mono), monospace'}}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeBlueprint.id === bp.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {bp.filename}
                  </button>
                ))}
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeBlueprint.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeBlueprint.purpose}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyCode(activeBlueprint.id, activeBlueprint.code)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedId === activeBlueprint.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <pre
                style={{fontFamily: 'var(--font-mono), monospace'}}
                className="flex-1 p-4 text-xs bg-slate-950 text-slate-100 rounded-lg overflow-x-auto leading-relaxed"
              >
                <code>{activeBlueprint.code}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Section 3: Interactive UI Primitives & Design Tokens */}
        <section
          id="ui-primitives"
          className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800"
        >
          <div>
            <h2
              style={{fontFamily: 'var(--font-display), sans-serif'}}
              className="text-xl font-bold text-slate-900 dark:text-slate-100"
            >
              04. Interactive UI Primitives & Form Controls
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pre-styled, accessible interface controls adhering to WCAG AA
              contrast and single-elevation surface discipline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Control Card 1: Environment & Toggle Controls */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Runtime Target & Feature Flags
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Segmented environment selector and accessible switch state.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Target Environment
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(['development', 'staging', 'production'] as const).map(
                    (env) => (
                      <button
                        key={env}
                        type="button"
                        onClick={() => setPrimitiveEnv(env)}
                        className={`flex-1 px-2.5 py-1.5 text-xs font-medium capitalize rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          primitiveEnv === env
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {env}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                    Strict Request Validation
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Current state: {primitiveSwitch ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={primitiveSwitch}
                  onClick={() => setPrimitiveSwitch(!primitiveSwitch)}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    primitiveSwitch
                      ? 'bg-blue-600 justify-end'
                      : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* Control Card 2: Range & Rate Limit Calibration */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Rate Limit Threshold
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tabular numeric readout with instant slider feedback.
                  </p>
                </div>
                <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    Max Burst Capacity
                  </span>
                  <span
                    style={{fontFamily: 'var(--font-mono), monospace'}}
                    className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
                  >
                    {primitiveThreshold}% ({primitiveThreshold * 20} req/s)
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={primitiveThreshold}
                  onChange={(e) =>
                    setPrimitiveThreshold(Number(e.target.value))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Selected Profile</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {primitiveEnv} · {primitiveSwitch ? 'Strict' : 'Permissive'}
                </span>
              </div>
            </div>

            {/* Control Card 3: Semantic Status Banner Triggers */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Semantic Feedback Triggers
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Accessible feedback states pairing color with explicit labels.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPrimitiveToast({
                      tone: 'success',
                      text: 'Build cache verified and static routes generated.',
                    })
                  }
                  className="w-full px-4 py-2 text-xs font-medium text-left text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Trigger Nominal State Banner
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPrimitiveToast({
                      tone: 'warning',
                      text: 'Rate limit approaching 85% of allocated quota.',
                    })
                  }
                  className="w-full px-4 py-2 text-xs font-medium text-left text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/70 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Trigger Warning State Banner
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPrimitiveToast({
                      tone: 'error',
                      text: 'Database connection timeout after 3000ms.',
                    })
                  }
                  className="w-full px-4 py-2 text-xs font-medium text-left text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/70 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Trigger Alert State Banner
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Dialog for Creating a New Starter Resource */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-create-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2
                id="modal-create-title"
                style={{fontFamily: 'var(--font-display), sans-serif'}}
                className="text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Register Starter Module
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                  Error: {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Module Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Stripe Billing Webhook Handler"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(
                        e.target.value as StarterResourceItem['category']
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="route">API Route</option>
                    <option value="component">Component</option>
                    <option value="database">Database</option>
                    <option value="deployment">Deployment</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(
                        e.target.value as StarterResourceItem['status']
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="In Review">In Review</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Maintainer
                  </label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Est. Requests / Min
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50000}
                    value={newRpm}
                    onChange={(e) => setNewRpm(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiet Footer (No ornamental telemetry tickers) */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Foundry Next.js Starter Template · Built with Next.js 15, React 19,
            TypeScript, and Tailwind CSS v4
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#overview"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Overview
            </a>
            <a
              href="#crud-sandbox"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              CRUD Registry
            </a>
            <a
              href="#api-inspector"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              API Inspector
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
