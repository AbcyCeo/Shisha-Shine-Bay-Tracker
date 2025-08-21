cat > src/app/page.tsx <<'TSX'
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type Wash = {
  id: string;
  plate: string;
  brand: string;
  color: string;
  type: string;       // final wash type (either selected or custom if "Other")
  date: string;       // yyyy-mm-dd
  operators: string;  // "Name1, Name2"
};

/* ---------- Constants ---------- */
const COLORS = ['White','Black','Silver','Grey','Blue','Red','Green','Yellow','Brown','Beige','Maroon','Gold','Other'] as const;
const BRANDS = ['Toyota','Volkswagen','Mercedes-Benz','BMW','Audi','Ford','Nissan','Hyundai','Kia','Renault','Isuzu','Mazda','Suzuki','Land Rover','Jeep','Mini','Volvo','Peugeot','Citroën','Porsche','Other'] as const;

const WASH_TYPES = [
  'Classic wash (in & out)',
  'Valet wash',
  'Lights polish',
  'Body polish (Hand glaze)',
  'Engine & Chassis',
  'Carpet cleaning',
  'Leather care',
  'Cleaning seats only',
  'Roof cleaning only',
  'Aircon treatment',
  'Other',               // ✅ now included
] as const;

const PASSWORD = '1990';

/* ---------- Helpers ---------- */
const today = () => new Date().toISOString().slice(0, 10);

function uid() {
  // very small helper uid
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ---------- Component ---------- */
export default function Page() {
  // search + clear
  const [search, setSearch] = useState('');
  const [pwd, setPwd] = useState('');

  // intake state
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState<(typeof BRANDS)[number]>('Toyota');
  const [brandOther, setBrandOther] = useState('');
  const [color, setColor] = useState<(typeof COLORS)[number]>('White');
  const [colorOther, setColorOther] = useState('');
  const [washType, setWashType] = useState<(typeof WASH_TYPES)[number]>('Classic wash (in & out)');
  const [washOther, setWashOther] = useState('');
  const [date, setDate] = useState(today());
  const [operators, setOperators] = useState('');           // intake operators (auto-filled)
  const [selectedBay, setSelectedBay] = useState<number>(1);

  // per‑bay defaults that auto‑fill the intake operators field
  const [bayDefaults, setBayDefaults] = useState<Record<number, string>>({
    1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: ''
  });

  // single-bay store of logs 1..9
  const [bays, setBays] = useState<Record<number, Wash[]>>({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []
  });

  // auto-fill operators when bay changes
  useEffect(() => {
    setOperators(bayDefaults[selectedBay] || '');
  }, [selectedBay, bayDefaults]);

  // filtered list for the currently selected bay
  const visible = useMemo(() => {
    const list = bays[selectedBay] ?? [];
    if (!search.trim()) {
      return list;
    }
    const q = search.toLowerCase();
    return list.filter(x =>
      x.plate.toLowerCase().includes(q) ||
      x.brand.toLowerCase().includes(q) ||
      x.color.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q) ||
      x.date.includes(q) ||
      x.operators.toLowerCase().includes(q)
    );
  }, [bays, selectedBay, search]);

  // group by date (newest first)
  const grouped = useMemo(() => {
    const map = new Map<string, Wash[]>();
    for (const w of visible) {
      if (!map.has(w.date)) map.set(w.date, []);
      map.get(w.date)!.push(w);
    }
    return Array.from(map.entries()).sort((a,b) => b[0].localeCompare(a[0]));
  }, [visible]);

  function handleInsert() {
    if (!plate.trim()) return;
    // resolve final brand/color/wash strings
    const finalBrand = brand === 'Other' ? (brandOther.trim() || 'Other') : brand;
    const finalColor = color === 'Other' ? (colorOther.trim() || 'Other') : color;
    const finalType  = washType === 'Other' ? (washOther.trim() || 'Other') : washType;

    const record: Wash = {
      id: uid(),
      plate: plate.trim().toUpperCase(),
      brand: String(finalBrand),
      color: String(finalColor),
      type: String(finalType),
      date,
      operators: operators.trim()
    };

    setBays(prev => ({
      ...prev,
      [selectedBay]: [record, ...(prev[selectedBay] ?? [])]
    }));

    // clear some fields, keep date and bay
    setPlate('');
    setWashType('Classic wash (in & out)');
    setWashOther('');
  }

  function handleClearAll() {
    if (pwd !== PASSWORD) {
      alert('Incorrect password.');
      return;
    }
    setBays({1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[]});
    setPwd('');
  }

  function handleExportAll() {
    const rows = [
      'bay,plate,brand,color,type,date,operators',
      ...Object.entries(bays).flatMap(([bay, list]) =>
        list.map(w => [bay, w.plate, w.brand, w.color, w.type, w.date, w.operators].join(','))
      )
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'shisha-shine-bays.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0f14]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-3 justify-between">
          <div className="text-lg font-semibold">Shisha Shine — Carwash Bay Tracker</div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search by plate, type, or date…"
              className="w-[260px] rounded-md border border-white/15 bg-[#0e141b] px-3 py-2 text-sm outline-none"
            />
            <button onClick={handleExportAll} className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-2 text-sm">
              Export All (CSV)
            </button>
            <input
              type="password"
              value={pwd}
              onChange={e=>setPwd(e.target.value)}
              placeholder="Password"
              className="w-[140px] rounded-md border border-white/15 bg-[#0e141b] px-3 py-2 text-sm outline-none"
            />
            <button onClick={handleClearAll} className="rounded-md bg-red-600 hover:bg-red-500 px-3 py-2 text-sm">
              Clear All
            </button>
            <div className="ml-2 hidden sm:block">
              <Image src="/shisha-logo.png" alt="Shisha Shine" width={70} height={28} className="opacity-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Intake */}
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="rounded-xl border border-white/10 bg-[#0e141b] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={plate}
              onChange={e=>setPlate(e.target.value)}
              placeholder="License Plate"
              className="w-[180px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm outline-none"
            />

            {/* Color */}
            <select
              value={color}
              onChange={e=>setColor(e.target.value as (typeof COLORS)[number])}
              className="w-[140px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm"
            >
              {COLORS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            {color === 'Other' && (
              <input
                value={colorOther}
                onChange={e=>setColorOther(e.target.value)}
                placeholder="Specify color"
                className="w-[160px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm outline-none"
              />
            )}

            {/* Brand */}
            <select
              value={brand}
              onChange={e=>setBrand(e.target.value as (typeof BRANDS)[number])}
              className="w-[160px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm"
            >
              {BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
            {brand === 'Other' && (
              <input
                value={brandOther}
                onChange={e=>setBrandOther(e.target.value)}
                placeholder="Specify brand"
                className="w-[160px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm outline-none"
              />
            )}

            {/* Wash type with "Other" */}
            <select
              value={washType}
              onChange={e=>setWashType(e.target.value as (typeof WASH_TYPES)[number])}
              className="w-[220px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm"
            >
              {WASH_TYPES.map(wt=><option key={wt} value={wt}>{wt}</option>)}
            </select>
            {washType === 'Other' && (
              <input
                value={washOther}
                onChange={e=>setWashOther(e.target.value)}
                placeholder="Describe custom wash"
                className="w-[220px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm outline-none"
              />
            )}

            {/* Date (calendar icon shows white on dark via color-scheme) */}
            <input
              type="date"
              value={date}
              onChange={e=>setDate(e.target.value)}
              className="w-[150px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm outline-none [color-scheme:dark]"
            />

            {/* Intake operators (auto-filled) */}
            <input
              value={operators}
              onChange={e=>setOperators(e.target.value)}
              placeholder="Operators (e.g., John, Lee)"
              className="w-[220px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm outline-none"
            />

            {/* Bay select + insert */}
            <select
              value={selectedBay}
              onChange={e=>setSelectedBay(Number(e.target.value))}
              className="w-[90px] rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm"
            >
              {Array.from({length:9},(_,i)=>i+1).map(n=>(
                <option key={n} value={n}>Bay {n}</option>
              ))}
            </select>

            <button
              onClick={handleInsert}
              className="ml-auto rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm"
            >
              Insert into Bay {selectedBay}
            </button>
          </div>

          {/* Small note row */}
          <div className="mt-3 text-xs text-gray-400">
            Newest days appear first. Use the <span className="text-gray-300 font-medium">Edit</span> button inside each date group to correct mistakes.
          </div>
        </div>

        {/* Bay view (single panel that switches by selectedBay) */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          {/* Left: selected bay */}
          <div className="rounded-2xl border border-white/10 bg-[#0e141b]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <div className="text-xs text-blue-400">{String(selectedBay).padStart(2,'0')}</div>
                <div className="text-lg font-semibold">Bay {selectedBay}</div>
              </div>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            </div>

            <div className="p-4 space-y-4">
              {grouped.length === 0 && (
                <div className="text-sm text-gray-400">No cars yet.</div>
              )}

              {grouped.map(([d, items]) => (
                <div key={d} className="rounded-lg border border-white/10">
                  <div className="flex items-center justify-between bg-[#111923] px-3 py-2">
                    <div className="text-sm font-medium">{d}</div>
                    <button
                      onClick={()=>alert(`(Placeholder) Batch edit for Bay ${selectedBay} on ${d}`)}
                      className="rounded-md border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
                    >
                      Edit
                    </button>
                  </div>
                  <ul className="p-3 text-sm">
                    {items.map(w=>(
                      <li key={w.id} className="list-disc list-inside">
                        {w.plate} — {w.color} {w.brand} — {w.type} — <span className="text-gray-400">{w.operators || '—'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Right: operator defaults for this bay */}
          <div className="rounded-2xl border border-white/10 bg-[#0e141b] p-4">
            <div className="mb-2 text-sm font-semibold">Operator Defaults (autofill Intake)</div>
            <div className="text-xs text-gray-400 mb-3">
              Set for this bay; the Intake operators field will auto‑fill for <span className="text-gray-200">Bay {selectedBay}</span>. You can still edit per entry.
            </div>
            <input
              value={bayDefaults[selectedBay] ?? ''}
              onChange={e=>{
                const v = e.target.value;
                setBayDefaults(prev => ({...prev, [selectedBay]: v}));
                // if the user is currently on that bay, also reflect into intake immediately
                setOperators(v);
              }}
              placeholder="Default operators (e.g., John, Lee)"
              className="w-full rounded-md border border-white/15 bg-[#0b0f14] px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mx-auto max-w-7xl text-center text-xs text-gray-400 py-8">
          ®️2025 — Developers: abcyreal@gmail.com
        </div>
      </div>
    </div>
  );
}
TSX
