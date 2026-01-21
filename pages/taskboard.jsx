import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  DEFAULT_BOARD,
  TASKBOARD_FILES_DB,
  TASKBOARD_STORAGE_KEY,
  uid,
} from "./data/taskboard.defaults";

import BulkAddModal from "../components/taskboard/BulkAddModal";


/**
 * 3ROTIX Mission Control / Taskboard
 * - Local-first: board in localStorage, files in IndexedDB
 * - Deep links: /taskboard?area=spine&task=auth-gating
 * - Export/Import JSON
 * - Tabs -> tasks -> subtasks + notes + links
 * - Docs Vault: upload files + attach notes/tags
 *
 * Later: replace persistence with Prisma/Supabase (multi-device/team sync).
 */

/* -------------------- IndexedDB tiny helper (no deps) -------------------- */
function openFilesDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(TASKBOARD_FILES_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openFilesDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await openFilesDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const req = tx.objectStore("files").get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbDel(key) {
  const db = await openFilesDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/* ----------------------------- utils ----------------------------- */
function clampText(s, n = 110) {
  const str = String(s || "");
  if (str.length <= n) return str;
  return str.slice(0, n - 1) + "…";
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function calcProgress(task) {
  const subs = Array.isArray(task?.subtasks) ? task.subtasks : [];
  if (subs.length === 0) return 0;
  const done = subs.filter((s) => !!s.done).length;
  return Math.round((done / subs.length) * 100);
}

function statusColor(status) {
  switch (status) {
    case "done":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "doing":
      return "bg-pink-500/15 text-pink-300 border-pink-500/30";
    case "blocked":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  }
}

function priorityColor(p) {
  switch (p) {
    case "P0":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "P1":
      return "bg-orange-500/15 text-orange-300 border-orange-500/30";
    case "P2":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  }
}

/* ----------------------------- page ----------------------------- */
export default function TaskboardPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [board, setBoard] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [openTaskId, setOpenTaskId] = useState(null);
 const [bulkOpen, setBulkOpen] = useState(false);
const [bulkListId, setBulkListId] = useState(null);


  // filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  // docs
  const [docsOpen, setDocsOpen] = useState(false);
  const [docQuery, setDocQuery] = useState("");

  // load board
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(TASKBOARD_STORAGE_KEY) : null;
    const parsed = raw ? safeJsonParse(raw) : null;
    const initial = parsed && parsed?.tabs ? parsed : DEFAULT_BOARD;

    setBoard(initial);

    const areaFromUrl = typeof router.query.area === "string" ? router.query.area : null;
    const taskFromUrl = typeof router.query.task === "string" ? router.query.task : null;

    const firstTab = areaFromUrl && initial.tabs.find((t) => t.id === areaFromUrl)
      ? areaFromUrl
      : initial.tabs[0]?.id;

    setActiveTabId(firstTab || initial.tabs[0]?.id || null);

    if (taskFromUrl) setOpenTaskId(taskFromUrl);
  }, [router.query.area, router.query.task]);

  // persist board
  useEffect(() => {
    if (!board) return;
    const next = { ...board, updatedAt: new Date().toISOString() };
    localStorage.setItem(TASKBOARD_STORAGE_KEY, JSON.stringify(next));
  }, [board]);

  const activeTab = useMemo(() => {
    if (!board || !activeTabId) return null;
    return board.tabs.find((t) => t.id === activeTabId) || null;
  }, [board, activeTabId]);

  const filteredTasks = useMemo(() => {
    const tasks = Array.isArray(activeTab?.tasks) ? activeTab.tasks : [];
    const q = search.trim().toLowerCase();

    return tasks.filter((t) => {
      const matchesQ =
        !q ||
        (t.title || "").toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q) ||
        (t.subtasks || []).some((s) => (s.title || "").toLowerCase().includes(q) || (s.notes || "").toLowerCase().includes(q));

      const matchesStatus = filterStatus === "all" ? true : (t.status || "todo") === filterStatus;
      const matchesPriority = filterPriority === "all" ? true : (t.priority || "P2") === filterPriority;

      return matchesQ && matchesStatus && matchesPriority;
    });
  }, [activeTab, search, filterStatus, filterPriority]);

  const filteredDocs = useMemo(() => {
    const docs = Array.isArray(board?.docs) ? board.docs : [];
    const q = docQuery.trim().toLowerCase();
    return docs.filter((d) => {
      if (!q) return true;
      return (
        (d.name || "").toLowerCase().includes(q) ||
        (d.notes || "").toLowerCase().includes(q) ||
        (d.tags || []).some((t) => String(t).toLowerCase().includes(q))
      );
    });
  }, [board, docQuery]);

  function setUrl(areaId, taskId = null) {
    const query = { ...router.query };
    query.area = areaId;
    if (taskId) query.task = taskId;
    else delete query.task;

    router.replace(
      { pathname: "/taskboard", query },
      undefined,
      { shallow: true }
    );
  }

  function updateTab(updater) {
    setBoard((prev) => {
      if (!prev) return prev;
      const tabs = prev.tabs.map((t) => (t.id === activeTabId ? updater(t) : t));
      return { ...prev, tabs };
    });
  }

  function addTab() {
    const name = prompt("New tab name?");
    if (!name) return;

    const id = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 24) || uid("tab");

    setBoard((prev) => {
      if (!prev) return prev;
      const exists = prev.tabs.some((t) => t.id === id);
      const finalId = exists ? uid("tab") : id;

      const nextTab = {
        id: finalId,
        name: name.trim(),
        icon: "✨",
        description: "",
        tasks: [],
        lists: [],
      };

      return { ...prev, tabs: [...prev.tabs, nextTab] };
    });

    setActiveTabId(id);
    setUrl(id);
  }

  function renameTab(tabId) {
    const next = prompt("Rename tab:", activeTab?.name || "");
    if (!next) return;

    setBoard((prev) => {
      const tabs = prev.tabs.map((t) => (t.id === tabId ? { ...t, name: next.trim() } : t));
      return { ...prev, tabs };
    });
  }

  function addTask() {
    const title = prompt("Task title?");
    if (!title) return;

    updateTab((tab) => ({
      ...tab,
      tasks: [
        {
          id: uid("task"),
          title: title.trim(),
          status: "todo",
          priority: "P2",
          link: "",
          notes: "",
          subtasks: [],
        },
        ...(tab.tasks || []),
      ],
    }));
  }

  function addList() {
    const title = prompt("New list title?");
    if (!title) return;

    updateTab((tab) => ({
      ...tab,
      lists: [
        ...(tab.lists || []),
        { id: uid("list"), title: title.trim(), items: [], notes: "" },
      ],
    }));
  }

  function updateTask(taskId, patch) {
    updateTab((tab) => ({
      ...tab,
      tasks: (tab.tasks || []).map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    }));
  }

  function addSubtask(taskId) {
    const title = prompt("Subtask title?");
    if (!title) return;

    updateTab((tab) => ({
      ...tab,
      tasks: (tab.tasks || []).map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: [
            ...(t.subtasks || []),
            { id: uid("st"), title: title.trim(), done: false, link: "", notes: "" },
          ],
        };
      }),
    }));
  }

  function updateSubtask(taskId, subId, patch) {
    updateTab((tab) => ({
      ...tab,
      tasks: (tab.tasks || []).map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: (t.subtasks || []).map((s) => (s.id === subId ? { ...s, ...patch } : s)),
        };
      }),
    }));
  }

  function deleteTask(taskId) {
    if (!confirm("Delete this task?")) return;
    updateTab((tab) => ({
      ...tab,
      tasks: (tab.tasks || []).filter((t) => t.id !== taskId),
    }));
    if (openTaskId === taskId) setOpenTaskId(null);
  }

  function deleteDoc(docId) {
    if (!confirm("Delete this doc from the vault?")) return;
    setBoard((prev) => ({
      ...prev,
      docs: (prev.docs || []).filter((d) => d.id !== docId),
    }));
    // also delete blob from IDB (best effort)
    idbDel(docId).catch(() => {});
  }

  function exportBoard() {
    if (!board) return;
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `3rotix-taskboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBoard(file) {
    const txt = await file.text();
    const parsed = safeJsonParse(txt);
    if (!parsed?.tabs) {
      alert("Invalid board file.");
      return;
    }
    setBoard(parsed);
    const first = parsed.tabs[0]?.id;
    setActiveTabId(first);
    setOpenTaskId(null);
    setUrl(first);
  }

  async function onPickDocs(files) {
    const fileArr = Array.from(files || []);
    if (!fileArr.length) return;

    for (const f of fileArr) {
      const id = uid("doc");
      const meta = {
        id,
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
        createdAt: new Date().toISOString(),
        notes: "",
        tags: [],
      };

      // store blob in IndexedDB
      try {
        await idbSet(id, f);
      } catch (e) {
        console.error("IDB store failed:", e);
        alert("Could not store file locally (IndexedDB).");
        continue;
      }

      setBoard((prev) => ({
        ...prev,
        docs: [meta, ...(prev.docs || [])],
      }));
    }
  }

  async function openDoc(doc) {
    const blob = await idbGet(doc.id);
    if (!blob) {
      alert("File blob not found (maybe cleared browser storage).");
      return;
    }
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // don't revoke immediately because new tab may need it
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  if (!board || !activeTab) {
    return (
      <main className="min-h-screen bg-black text-white grid place-items-center">
        Loading…
      </main>
    );
  }

  const totalTabs = board.tabs.length;

  return (
    <main className="min-h-screen bg-black text-white">
      <Head>
        <title>Mission Control — 3ROTIX</title>
        <meta name="description" content="3ROTIX Mission Control taskboard" />
      </Head>

      {/* Background vibe */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-0 h-[320px] w-[320px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/25 bg-pink-500/10 px-3 py-1 text-xs text-pink-200">
              <span className="h-2 w-2 rounded-full bg-pink-400" />
              Mission Control
              <span className="opacity-70">•</span>
              <span className="opacity-80">{totalTabs} tabs</span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Ship mode. No excuses.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-300">
              Tabs = big areas. Tasks expand. Subtasks check off. Notes live here. Docs vault keeps your research in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDocsOpen(true)}
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm font-semibold hover:border-pink-500/30 hover:bg-zinc-950"
            >
              📚 Docs Vault
            </button>

            <button
              onClick={exportBoard}
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm font-semibold hover:border-pink-500/30 hover:bg-zinc-950"
            >
              Export
            </button>

            <label className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm font-semibold hover:border-pink-500/30 hover:bg-zinc-950">
              Import
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importBoard(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto rounded-2xl border border-zinc-900 bg-zinc-950/40 p-2">
          {board.tabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setOpenTaskId(null);
                  setUrl(tab.id);
                }}
                className={[
                  "shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-pink-500/15 text-pink-200 border border-pink-500/25"
                    : "bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white",
                ].join(" ")}
                title={tab.description || tab.name}
              >
                <span className="mr-2">{tab.icon || "📌"}</span>
                {tab.name}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => renameTab(activeTabId)}
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-pink-500/30 hover:text-white"
              title="Rename tab"
            >
              Rename
            </button>

            <button
              onClick={addTab}
              className="rounded-xl border border-pink-500/25 bg-pink-500/10 px-3 py-2 text-xs font-extrabold text-pink-200 hover:bg-pink-500/15"
              title="Add tab"
            >
              + Tab
            </button>
          </div>
        </div>

        {/* Tab header + controls */}
        <div className="mt-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">
                {activeTab.icon || "📌"} {activeTab.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-300">
                {activeTab.description || "No description yet. Add notes below."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={addTask}
                className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-extrabold hover:bg-pink-700"
              >
                + Task
              </button>
              <button
                onClick={addList}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm font-semibold hover:border-pink-500/30 hover:bg-zinc-950"
              >
                + List
              </button>
              <button
                onClick={() => setDocsOpen(true)}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm font-semibold hover:border-pink-500/30 hover:bg-zinc-950"
              >
                + Doc
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400">Search</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-2 text-sm outline-none focus:border-pink-500/40"
                placeholder="Search tasks / subtasks / notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400">Status</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-2 text-sm outline-none focus:border-pink-500/40"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="todo">Todo</option>
                <option value="doing">Doing</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400">Priority</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-2 text-sm outline-none focus:border-pink-500/40"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All</option>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lists (checklist boards) */}
        {Array.isArray(activeTab.lists) && activeTab.lists.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeTab.lists.map((list) => (
              <div key={list.id} className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold">{list.title}</h3>
                    {list.notes ? (
                      <p className="mt-1 text-sm text-zinc-400">{clampText(list.notes, 140)}</p>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-500">Add checklist items + notes.</p>
                    )}
                  </div>
                  <button
                    className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs font-semibold hover:border-pink-500/30"
                    onClick={() => {
                      const item = prompt("New checklist item?");
                      if (!item) return;
                      updateTab((tab) => ({
                        ...tab,
                        lists: (tab.lists || []).map((l) => {
                          if (l.id !== list.id) return l;
                          return {
                            ...l,
                            items: [...(l.items || []), { id: uid("li"), text: item.trim(), checked: false, notes: "" }],
                          };
                        }),
                      }));
                    }}
                  >
                    + Item
                  </button>
                  <button
  onClick={() => setBulkOpen(true)}
  className="rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-900"
>
  Bulk add
</button>

                </div>

                <div className="mt-4 space-y-3">
                  {(list.items || []).map((it) => (
                    <div key={it.id} className="rounded-xl border border-zinc-900 bg-black/30 p-3">
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-pink-500"
                          checked={!!it.checked}
                          onChange={(e) => {
                            updateTab((tab) => ({
                              ...tab,
                              lists: (tab.lists || []).map((l) => {
                                if (l.id !== list.id) return l;
                                return {
                                  ...l,
                                  items: (l.items || []).map((x) =>
                                    x.id === it.id ? { ...x, checked: e.target.checked } : x
                                  ),
                                };
                              }),
                            }));
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-zinc-200">{it.text}</div>
                          <textarea
                            className="mt-2 w-full rounded-xl border border-zinc-900 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500/30"
                            placeholder="Notes…"
                            value={it.notes || ""}
                            onChange={(e) => {
                              updateTab((tab) => ({
                                ...tab,
                                lists: (tab.lists || []).map((l) => {
                                  if (l.id !== list.id) return l;
                                  return {
                                    ...l,
                                    items: (l.items || []).map((x) =>
                                      x.id === it.id ? { ...x, notes: e.target.value } : x
                                    ),
                                  };
                                }),
                              }));
                            }}
                          />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <textarea
                    className="w-full rounded-xl border border-zinc-900 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500/30"
                    placeholder="List notes…"
                    value={list.notes || ""}
                    onChange={(e) => {
                      updateTab((tab) => ({
                        ...tab,
                        lists: (tab.lists || []).map((l) => (l.id === list.id ? { ...l, notes: e.target.value } : l)),
                      }));
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
{/* Bulk Add Modal (single instance) */}
{bulkOpen ? (() => {
  const targetList =
    (activeTab?.lists || []).find((l) => l.id === bulkListId) || null;

  return (
    <BulkAddModal
      open={bulkOpen}
      onClose={() => {
        setBulkOpen(false);
        setBulkListId(null);
      }}
      existingItems={targetList?.items || []}
      title={`Bulk add to "${targetList?.title || "List"}"`}
      onConfirm={(newItems) => {
        // normalize: accept strings OR objects
        const normalized = (newItems || [])
          .map((x) => {
            if (!x) return null;
            if (typeof x === "string") {
              const t = x.trim();
              if (!t) return null;
              return { id: uid("li"), text: t, checked: false, notes: "" };
            }
            // assume already object-shaped {text, ...}
            const text = String(x.text || "").trim();
            if (!text) return null;
            return {
              id: x.id || uid("li"),
              text,
              checked: !!x.checked,
              notes: x.notes || "",
            };
          })
          .filter(Boolean);

        if (!normalized.length) {
          setBulkOpen(false);
          setBulkListId(null);
          return;
        }

        updateTab((tab) => ({
          ...tab,
          lists: (tab.lists || []).map((l) => {
            if (l.id !== bulkListId) return l;
            return {
              ...l,
              items: [...(l.items || []), ...normalized],
            };
          }),
        }));

        setBulkOpen(false);
        setBulkListId(null);
      }}
    />
  );
})() : null}

        {/* Tasks */}
        <div className="mt-6 space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-8 text-center text-zinc-400">
              No tasks match your filters. Add a task or loosen the search.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isOpen = openTaskId === task.id;
              const progress = calcProgress(task);

              return (
                <div key={task.id} className="rounded-2xl border border-zinc-900 bg-zinc-950/40">
                  <button
                    className="w-full p-5 text-left"
                    onClick={() => {
                      const nextOpen = isOpen ? null : task.id;
                      setOpenTaskId(nextOpen);
                      setUrl(activeTabId, nextOpen || null);
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusColor(task.status || "todo")}`}>
                            {(task.status || "todo").toUpperCase()}
                          </span>
                          <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${priorityColor(task.priority || "P2")}`}>
                            {task.priority || "P2"}
                          </span>
                          <span className="rounded-full border border-zinc-800 bg-black/40 px-2 py-1 text-xs text-zinc-300">
                            {progress}% complete
                          </span>
                        </div>

                        <div className="mt-2 text-lg font-extrabold">
                          {task.title}
                        </div>

                        {task.notes ? (
                          <div className="mt-1 text-sm text-zinc-400">
                            {clampText(task.notes, 180)}
                          </div>
                        ) : (
                          <div className="mt-1 text-sm text-zinc-500">
                            Add notes, links, subtasks. Make it real.
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {task.link ? (
                          <a
                            href={task.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs font-semibold hover:border-pink-500/30"
                            onClick={(e) => e.stopPropagation()}
                            title="Open route in new tab"
                          >
                            Open ↗
                          </a>
                        ) : null}

                        <button
                          className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs font-semibold hover:border-pink-500/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            addSubtask(task.id);
                          }}
                        >
                          + Subtask
                        </button>

                        <button
                          className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs font-semibold hover:border-red-500/30 hover:text-red-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* progress bar */}
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/40">
                      <div className="h-full bg-pink-500/70" style={{ width: `${progress}%` }} />
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="border-t border-zinc-900 p-5">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-4">
                          {/* subtasks */}
                          <div className="rounded-2xl border border-zinc-900 bg-black/30 p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-extrabold text-zinc-200">Subtasks</div>
                              <button
                                className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs font-semibold hover:border-pink-500/30"
                                onClick={() => addSubtask(task.id)}
                              >
                                + Add
                              </button>
                            </div>

                            <div className="mt-3 space-y-3">
                              {(task.subtasks || []).length === 0 ? (
                                <div className="rounded-xl border border-zinc-900 bg-black/20 p-3 text-sm text-zinc-500">
                                  No subtasks yet. Add 2–5 and stop winging it.
                                </div>
                              ) : (
                                (task.subtasks || []).map((st) => (
                                  <div key={st.id} className="rounded-xl border border-zinc-900 bg-black/20 p-3">
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 accent-pink-500"
                                        checked={!!st.done}
                                        onChange={(e) =>
                                          updateSubtask(task.id, st.id, { done: e.target.checked })
                                        }
                                      />

                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className={`text-sm font-semibold ${st.done ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                                            {st.title}
                                          </div>

                                          {st.link ? (
                                            <a
                                              href={st.link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs font-semibold text-pink-300 hover:text-pink-200"
                                              title="Open route in new tab"
                                            >
                                              Open ↗
                                            </a>
                                          ) : null}
                                        </div>

                                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                          <input
                                            className="w-full rounded-xl border border-zinc-900 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500/30"
                                            placeholder="Link (route) e.g. /studio"
                                            value={st.link || ""}
                                            onChange={(e) =>
                                              updateSubtask(task.id, st.id, { link: e.target.value })
                                            }
                                          />
                                          <button
                                            className="rounded-xl border border-zinc-900 bg-black/40 px-3 py-2 text-xs font-semibold hover:border-pink-500/30"
                                            onClick={() => {
                                              const note = prompt("Quick note for this subtask?", st.notes || "");
                                              if (note === null) return;
                                              updateSubtask(task.id, st.id, { notes: note });
                                            }}
                                          >
                                            Quick Note
                                          </button>
                                        </div>

                                        <textarea
                                          className="mt-2 w-full rounded-xl border border-zinc-900 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500/30"
                                          placeholder="Subtask notes…"
                                          value={st.notes || ""}
                                          onChange={(e) =>
                                            updateSubtask(task.id, st.id, { notes: e.target.value })
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* task notes */}
                          <div className="rounded-2xl border border-zinc-900 bg-black/30 p-4">
                            <div className="text-sm font-extrabold text-zinc-200">Task Notes</div>
                            <textarea
                              className="mt-3 w-full rounded-2xl border border-zinc-900 bg-black/40 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-pink-500/30"
                              placeholder="What’s the real blocker? What decision did you make? What’s the next action?"
                              value={task.notes || ""}
                              onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* side controls */}
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-zinc-900 bg-black/30 p-4">
                            <div className="text-sm font-extrabold text-zinc-200">Controls</div>

                            <div className="mt-3 grid grid-cols-1 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-zinc-400">Status</label>
                                <select
                                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-2 text-sm outline-none focus:border-pink-500/40"
                                  value={task.status || "todo"}
                                  onChange={(e) => updateTask(task.id, { status: e.target.value })}
                                >
                                  <option value="todo">Todo</option>
                                  <option value="doing">Doing</option>
                                  <option value="blocked">Blocked</option>
                                  <option value="done">Done</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-zinc-400">Priority</label>
                                <select
                                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-2 text-sm outline-none focus:border-pink-500/40"
                                  value={task.priority || "P2"}
                                  onChange={(e) => updateTask(task.id, { priority: e.target.value })}
                                >
                                  <option value="P0">P0</option>
                                  <option value="P1">P1</option>
                                  <option value="P2">P2</option>
                                  <option value="P3">P3</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-zinc-400">Route Link</label>
                                <input
                                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-2 text-sm outline-none focus:border-pink-500/40"
                                  placeholder="/dashboard or https://…"
                                  value={task.link || ""}
                                  onChange={(e) => updateTask(task.id, { link: e.target.value })}
                                />
                              </div>

                              <button
                                className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-extrabold hover:bg-pink-700"
                                onClick={() => alert("Saved locally. (Export if you want a backup.)")}
                              >
                                Save
                              </button>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-zinc-900 bg-black/30 p-4">
                            <div className="text-sm font-extrabold text-zinc-200">Deep Link</div>
                            <p className="mt-2 text-xs text-zinc-400">
                              This URL opens the same tab + task.
                            </p>
                            <div className="mt-3 rounded-xl border border-zinc-900 bg-black/40 px-3 py-2 text-xs text-zinc-300 break-all">
                              {`/taskboard?area=${activeTabId}&task=${task.id}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Docs Vault Modal */}
      {docsOpen ? (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm">
          <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6">
            <div className="rounded-3xl border border-zinc-900 bg-zinc-950/90 shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-900 p-5">
                <div>
                  <div className="text-xs font-semibold text-zinc-400">Vault</div>
                  <div className="text-2xl font-extrabold">Docs + Research</div>
                  <p className="mt-1 text-sm text-zinc-300">
                    Upload docs, keep notes/tags, and open them while you build. Stored locally in your browser.
                  </p>
                </div>
                <button
                  onClick={() => setDocsOpen(false)}
                  className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-2 text-sm font-semibold hover:border-pink-500/30"
                >
                  Close
                </button>
              </div>

              <div className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <input
                      className="w-full rounded-2xl border border-zinc-800 bg-black/50 px-4 py-3 text-sm outline-none focus:border-pink-500/40"
                      placeholder="Search docs by name, notes, tags…"
                      value={docQuery}
                      onChange={(e) => setDocQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-2xl bg-pink-600 px-5 py-3 text-sm font-extrabold hover:bg-pink-700"
                    >
                      Upload Docs
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        onPickDocs(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredDocs.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-zinc-900 bg-black/30 p-8 text-center text-zinc-400">
                      No docs yet. Upload PDFs, notes, screenshots, whatever.
                    </div>
                  ) : (
                    filteredDocs.map((doc) => (
                      <div key={doc.id} className="rounded-2xl border border-zinc-900 bg-black/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-zinc-200 truncate">
                              {doc.name}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {(doc.type || "file")} • {Math.round((doc.size || 0) / 1024)} KB • {new Date(doc.createdAt).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => openDoc(doc)}
                              className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs font-semibold hover:border-pink-500/30"
                            >
                              Open ↗
                            </button>
                            <button
                              onClick={() => deleteDoc(doc.id)}
                              className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs font-semibold hover:border-red-500/30 hover:text-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <textarea
                            className="w-full rounded-2xl border border-zinc-900 bg-black/40 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-pink-500/30"
                            placeholder="Doc notes… what is it, why does it matter, where does it apply?"
                            value={doc.notes || ""}
                            onChange={(e) => {
                              setBoard((prev) => ({
                                ...prev,
                                docs: (prev.docs || []).map((d) => (d.id === doc.id ? { ...d, notes: e.target.value } : d)),
                              }));
                            }}
                          />
                        </div>

                        <div className="mt-3">
                          <label className="text-xs font-semibold text-zinc-400">Tags (comma separated)</label>
                          <input
                            className="mt-1 w-full rounded-xl border border-zinc-900 bg-black/40 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-pink-500/30"
                            placeholder="compliance, payments, agegate…"
                            value={(doc.tags || []).join(", ")}
                            onChange={(e) => {
                              const tags = e.target.value
                                .split(",")
                                .map((x) => x.trim())
                                .filter(Boolean)
                                .slice(0, 12);
                              setBoard((prev) => ({
                                ...prev,
                                docs: (prev.docs || []).map((d) => (d.id === doc.id ? { ...d, tags } : d)),
                              }));
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-900 bg-black/30 p-4">
                  <div className="text-sm font-extrabold text-zinc-200">Important</div>
                  <p className="mt-2 text-sm text-zinc-400">
                    This vault stores files in your browser (IndexedDB). If you clear site data, files disappear.
                    Export your board JSON regularly (top-right on Taskboard). Later we can sync docs to Supabase Storage for real persistence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
