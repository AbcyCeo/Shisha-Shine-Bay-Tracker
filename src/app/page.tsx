'use client';

import { useMemo, useState } from 'react';

type Intake = {
  id: string;
  brand: string;
  color: string;
  plate: string;
  washType: string;
  operators: string;
  bay: number;      // 1..9
  date: string;     // ISO
};

const BAY_COUNT = 9;

export default function Home() {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [searchBay, setSearchBay] = useState<string>('');
  const [pwd, setPwd] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [washType, setWashType] = useState('');
  const [operators, setOperators] = useState('');
  const [bay, setBay] = useState<number>(1);

  const bays = useMemo(() => {
    const target = Number(searchBay);
    const base = Array.from({ length: BAY_COUNT }, (_, i) => i + 1);
    const ids = isNaN(target) ? base : base.filter((b) => b === target);
    return ids.map((b) => ({
      id: b,
      items: intakes
        .filter((x) => x.bay === b)
        .sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }, [intakes, searchBay]);

  function handleAdd() {
    if (!brand || !plate || !washType || !operators || !bay) return;
    const now = new Date().toISOString();
    const id = (globalThis as any)?.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    setIntakes((prev) => [
      { id, brand: brand.trim(), color: color.trim(), plate: plate.trim().toUpperCase(), washType: washType.trim(), operators: operators.trim(), bay, date: now },
      ...prev,
    ]);
    setBrand(''); setColor(''); setPlate(''); setWashType(''); setOperators('');
  }

  function handleClearAll() {
    if (pwd !== '1990') { alert('Incorrect password.'); return; }
    setIntakes([]); setPwd('');
  }

  function handleClearBay(targetBay: number) {
    if (pwd !== '1990') { alert('Incorrect password.'); return; }
    setIntakes((prev) => prev.filter((x) => x.bay !== targetBay)); setPwd('');
  }

  function handleExport(scope: 'all' | number) {
    const rows = (scope === 'all' ? intakes : intakes.filter((x) => x.bay === scope))
      .map((x) => [x.date, x.bay, x.brand, x.color, x.plate, x.washType, x.operators].join(','));
    const header = 'date,bay,brand,color,plate,washType,operators';
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = scope === 'all' ? 'bays-all.csv' : `bay-${scope}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Shisha Shine — Carwash Bay Tracker</h1>
            <p className="text-sm text-gray-600">Intake bar • 9 Bay Grid • Search • Export • Protected Clear</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Password for clear" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <button onClick={handleClearAll} className="rounded-md border border-red-600 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" title="Clear all bays (requires password 1990)">Clear All</button>
            <button onClick={() => handleExport('all')} className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">Export All (CSV)</button>
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-6">
            <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Car brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
            <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase" placeholder="Plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
            <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Wash type" value={washType} onChange={(e) => setWashType(e.target.value)} />
            <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Operators" value={operators} onChange={(e) => setOperators(e.target.value)} />
            <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={bay} onChange={(e) => setBay(Number(e.target.value))}>
              {Array.from({ length: BAY_COUNT }, (_, i) => i + 1).map((b) => (<option key={b} value={b}>Bay {b}</option>))}
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button onClick={handleAdd} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">Add to Bay</button>
            <div className="flex items-center gap-2">
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Search by bay (1-9)" value={searchBay} onChange={(e) => setSearchBay(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bays.map(({ id, items }) => (
            <div key={id} className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-600">{String(id).padStart(2, '0')}</div>
                  <div className="text-lg font-medium">Bay {id}</div>
                </div>
                <span className="mt-1 inline-block h-3 w-3 rounded-full bg-blue-600"></span>
              </div>
              <ul className="mb-4 space-y-2">
                {items.length === 0 && <li className="text-sm text-gray-400">No cars yet.</li>}
                {items.slice(0, 6).map((x) => (
                  <li key={x.id} className="text-sm">
                    <span className="font-medium">{x.plate}</span> • {x.brand} {x.color ? `(${x.color})` : ''} — {x.washType}
                    <div className="text-xs text-gray-500">{new Date(x.date).toLocaleString()} • {x.operators}</div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <button onClick={() => handleClearBay(id)} className="rounded-md border border-red-600 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" title="Clear this bay (requires password 1990)">Clear Bay</button>
                <button onClick={() => handleExport(id)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-100">Export CSV</button>
              </div>
            </div>
          ))}
        </section>

        <p className="mt-6 text-xs text-gray-500">Auto-clear after 35 days, operator logins, and persistent storage will be added next.</p>
      </div>
    </main>
  );
}
