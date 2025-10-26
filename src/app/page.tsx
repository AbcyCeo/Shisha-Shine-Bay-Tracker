'use client';

import Image from "next/image";
import { useMemo, useState } from "react";

type Wash = {
  id: number;
  plate: string;
  brand: string;
  color: string;
  type: string;
  date: string;          // YYYY-MM-DD
  operators: string;     // "Name,Name"
};

const BRANDS = ["Toyota","Volkswagen","Mercedes-Benz","BMW","Audi","Ford","Nissan","Hyundai","Kia","Renault","Isuzu","Mazda","Suzuki","Land Rover","Jeep","Mini","Volvo","Peugeot","Citroën","Porsche","Other"];
const COLORS = ["White","Black","Silver","Grey","Blue","Red","Green","Yellow","Brown","Beige","Maroon","Gold","Other"];
const WASH_TYPES = ["Classic wash (in & out)","Valet wash","Lights polish","Body polish (Hand glaze)","Engine & Chassis","Carpet cleaning","Leather care","Cleaning seats only","Roof cleaning only","Aircon treatment","Other"];

export default function Home() {
  // Single box shows the currently selected bay
  const [selectedBay, setSelectedBay] = useState<number>(1);

  // Intake state (operators autofilled from defaults)
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState(BRANDS[0]);
  const [brandOther, setBrandOther] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [colorOther, setColorOther] = useState("");
  const [type, setType] = useState(WASH_TYPES[0]);
  const [typeOther, setTypeOther] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [intakeOperators, setIntakeOperators] = useState("");

  // Per-bay operator defaults (affects autofill for intake)
  const [bayOperatorDefaults, setBayOperatorDefaults] = useState<Record<number,string>>({
    1: "",2:"",3:"",4:"",5:"",6:"",7:"",8:"",9:""
  });

  // All data grouped by bay
  const [bayData, setBayData] = useState<Record<number, Wash[]>>({
    1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[]
  });

  const [search, setSearch] = useState("");
  const [clearPassword, setClearPassword] = useState("");
  const [editModal, setEditModal] = useState<{bay:number; day:string} | null>(null);
  const [seq, setSeq] = useState(1);

  // keep intake operators synced to selected bay default (but allow manual change)
  useMemo(() => {
    setIntakeOperators((prev) => prev || bayOperatorDefaults[selectedBay] || "");
  }, [selectedBay, bayOperatorDefaults]);

  const visibleList = useMemo(() => {
    const list = bayData[selectedBay] || [];
    // group by date (newest first)
    const groups = list.reduce((acc: Record<string, Wash[]>, w) => {
      if (!acc[w.date]) acc[w.date] = [];
      acc[w.date].push(w);
      return acc;
    }, {});
    const orderedDays = Object.keys(groups).sort((a,b) => b.localeCompare(a));
    // simple search by plate/type/date/brand/color/operators
    const filtered: Array<{day:string; items:Wash[]}> = [];
    for (const d of orderedDays) {
      const items = groups[d].filter(w =>
        w.plate.toLowerCase().includes(search.toLowerCase()) ||
        w.type.toLowerCase().includes(search.toLowerCase()) ||
        w.date.includes(search) ||
        w.brand.toLowerCase().includes(search.toLowerCase()) ||
        w.color.toLowerCase().includes(search.toLowerCase()) ||
        w.operators.toLowerCase().includes(search.toLowerCase())
      );
      if (items.length) filtered.push({ day:d, items });
    }
    return filtered;
  }, [bayData, selectedBay, search]);

  function effective(v: string, other: string) {
    return v === "Other" ? (other.trim() || "Other") : v;
  }

  function handleAdd() {
    if (!plate.trim()) return;
    const newWash: Wash = {
      id: seq,
      plate: plate.trim().toUpperCase(),
      brand: effective(brand, brandOther),
      color: effective(color, colorOther),
      type: effective(type, typeOther),
      date,
      operators: intakeOperators.trim(),
    };
    setSeq((n)=>n+1);
    setBayData(prev => ({
      ...prev,
      [selectedBay]: [...(prev[selectedBay]||[]), newWash]
    }));
    // reset keep operators/date
    setPlate("");
    setBrand(BRANDS[0]); setBrandOther("");
    setColor(COLORS[0]); setColorOther("");
    setType(WASH_TYPES[0]); setTypeOther("");
  }

  function handleClearAll() {
    if (clearPassword !== "1990") { alert("Incorrect password."); return; }
    setBayData({1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[]});
    setClearPassword("");
  }

  function handleExportAll() {
    let csv = "Bay,Plate,Brand,Color,Type,Date,Operators\n";
    for (let b=1;b<=9;b++){
      for (const w of (bayData[b]||[])) {
        csv += `${b},${w.plate},${w.brand},${w.color},${w.type},${w.date},${w.operators}\n`;
      }
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "bays-all.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // Batch edit (simple inline edit modal)
  function openEdit(day: string) { setEditModal({ bay: selectedBay, day }); }
  function closeEdit() { setEditModal(null); }

  function updateItem(id:number, patch: Partial<Wash>) {
    setBayData(prev=>{
      const copy = {...prev};
      copy[selectedBay] = (copy[selectedBay]||[]).map(w=> w.id===id ? {...w, ...patch} : w);
      return copy;
    });
  }

  function deleteItem(id:number) {
    setBayData(prev=>{
      const copy = {...prev};
      copy[selectedBay] = (copy[selectedBay]||[]).filter(w=> w.id!==id);
      return copy;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-xl font-semibold">Shisha Shine — Carwash Bay Tracker</h1>
            <p className="text-xs text-gray-600">Intake bar • Single Bay View • Search • Export • Protected Clear</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search (plate, type, date, brand, color, ops)"
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-64"
          />
          <button onClick={handleExportAll} className="border rounded px-3 py-2 text-sm hover:bg-gray-100">Export All (CSV)</button>
          <input
            type="password"
            placeholder="Password"
            value={clearPassword}
            onChange={(e)=>setClearPassword(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-28"
          />
          <button onClick={handleClearAll} className="border border-red-600 text-red-700 rounded px-3 py-2 text-sm hover:bg-red-50">Clear All</button>
          <Image src="/shisha-logo.png" alt="Shisha Shine" width={120} height={40} className="object-contain" priority />
        </div>
      </div>

      {/* Intake Row */}
      <section className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-9">
          {/* Bay select controls what the single box shows */}
          <select className="border rounded px-3 py-2 text-sm" value={selectedBay} onChange={(e)=>setSelectedBay(Number(e.target.value))}>
            {Array.from({length:9},(_,i)=>i+1).map(b=><option key={b} value={b}>Bay {b}</option>)}
          </select>

          <input className="border rounded px-3 py-2 text-sm uppercase" placeholder="License Plate" value={plate} onChange={(e)=>setPlate(e.target.value)} />

          {/* Brand with Other */}
          <div className="flex gap-2">
            <select className="border rounded px-3 py-2 text-sm" value={brand} onChange={(e)=>setBrand(e.target.value)}>
              {BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
            {brand === "Other" && (
              <input className="border rounded px-3 py-2 text-sm" placeholder="Brand (Other)" value={brandOther} onChange={(e)=>setBrandOther(e.target.value)} />
            )}
          </div>

          {/* Color with Other */}
          <div className="flex gap-2">
            <select className="border rounded px-3 py-2 text-sm" value={color} onChange={(e)=>setColor(e.target.value)}>
              {COLORS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            {color === "Other" && (
              <input className="border rounded px-3 py-2 text-sm" placeholder="Color (Other)" value={colorOther} onChange={(e)=>setColorOther(e.target.value)} />
            )}
          </div>

          {/* Wash type with Other */}
          <div className="flex gap-2">
            <select className="border rounded px-3 py-2 text-sm" value={type} onChange={(e)=>setType(e.target.value)}>
              {WASH_TYPES.map(w=><option key={w} value={w}>{w}</option>)}
            </select>
            {type === "Other" && (
              <input className="border rounded px-3 py-2 text-sm" placeholder="Wash (Other)" value={typeOther} onChange={(e)=>setTypeOther(e.target.value)} />
            )}
          </div>

          {/* Date */}
          <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="border rounded px-3 py-2 text-sm" />

          {/* Operators (autofilled from defaults for selected bay; single field "name,name") */}
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Operators (e.g. John,Doe)"
            value={intakeOperators}
            onChange={(e)=>setIntakeOperators(e.target.value)}
          />

          <button onClick={handleAdd} className="rounded bg-black text-white px-4 py-2 text-sm hover:opacity-90">Insert</button>
        </div>
      </section>

      {/* Layout: Left = Single Bay Box, Right = Operator Defaults */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Single Bay Box (center/left spanning 2 columns) */}
        <section className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-blue-600">{String(selectedBay).padStart(2,"0")}</div>
              <div className="text-lg font-medium">Bay {selectedBay}</div>
            </div>
          </div>

          {visibleList.length === 0 ? (
            <div className="text-sm text-gray-400">No logs yet.</div>
          ) : (
            <div className="space-y-4">
              {visibleList.map(({day, items}) => (
                <div key={day} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{day}</span>
                    <button className="text-sm text-blue-600 underline" onClick={()=>openEdit(day)}>Edit</button>
                  </div>
                  <ul className="ml-4 text-sm list-disc">
                    {items.map(w=>(
                      <li key={w.id}>
                        {w.plate} — {w.brand} {w.color ? `(${w.color})` : ""} — {w.type} — {w.operators}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Operator Defaults (right) */}
        <aside className="rounded-2xl border bg-white p-4 shadow-sm h-fit">
          <h3 className="font-semibold mb-3">Operator Defaults</h3>
          <p className="text-xs text-gray-600 mb-2">Set default operators per bay (autofills Intake Operators when that bay is selected).</p>
          <div className="space-y-2">
            {Array.from({length:9},(_,i)=>i+1).map(b=>(
              <div key={b} className="flex items-center gap-2">
                <span className="w-12 text-sm">Bay {b}</span>
                <input
                  className="flex-1 border rounded px-3 py-1.5 text-sm"
                  placeholder="name,name"
                  value={bayOperatorDefaults[b] || ""}
                  onChange={(e)=>{
                    const v = e.target.value;
                    setBayOperatorDefaults(prev=>({...prev,[b]:v}));
                    if (b===selectedBay && !intakeOperators) setIntakeOperators(v);
                  }}
                />
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <div className="text-right text-xs text-gray-500 mt-6">
        ®️2025 — Developers: corporate@whkauto.com
      </div>

      {/* Simple batch editor modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Edit — Bay {editModal.bay} • {editModal.day}</div>
              <button onClick={closeEdit} className="text-sm px-2 py-1 border rounded hover:bg-gray-100">Close</button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
              {(bayData[editModal.bay]||[])
                .filter(w=>w.date===editModal.day)
                .map(w=>(
                  <div key={w.id} className="grid grid-cols-6 gap-2 items-center">
                    <input className="border rounded px-2 py-1 text-sm col-span-1" value={w.plate} onChange={e=>updateItem(w.id,{plate:e.target.value.toUpperCase()})}/>
                    <input className="border rounded px-2 py-1 text-sm col-span-1" value={w.brand} onChange={e=>updateItem(w.id,{brand:e.target.value})}/>
                    <input className="border rounded px-2 py-1 text-sm col-span-1" value={w.color} onChange={e=>updateItem(w.id,{color:e.target.value})}/>
                    <input className="border rounded px-2 py-1 text-sm col-span-1" value={w.type} onChange={e=>updateItem(w.id,{type:e.target.value})}/>
                    <input className="border rounded px-2 py-1 text-sm col-span-1" value={w.operators} onChange={e=>updateItem(w.id,{operators:e.target.value})}/>
                    <button className="text-sm border rounded px-2 py-1 hover:bg-red-50" onClick={()=>deleteItem(w.id)}>Delete</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
