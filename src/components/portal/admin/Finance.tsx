"use client";

import * as React from "react";
import { Trash2, Wallet } from "lucide-react";
import { Button, Card, Input, Modal, Select, Tabs } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { formatINR } from "@/lib/utils";

export function AdminFinance({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const [tab, setTab] = React.useState("expenses");
  const [showExpense, setShowExpense] = React.useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Finance</h1>
        <p className="text-sm text-ink-500">Expenses and instructor payroll.</p>
      </div>

      <Tabs tabs={[{ id: "expenses", label: "Expenses" }, { id: "payroll", label: "Payroll" }]} active={tab} onChange={setTab} />

      {tab === "expenses" ? (
        <ExpensesView data={data} refresh={refresh} onAdd={() => setShowExpense(true)} showModal={showExpense} closeModal={() => setShowExpense(false)} />
      ) : (
        <PayrollView data={data} refresh={refresh} />
      )}
    </div>
  );
}

function ExpensesView({ data, refresh, onAdd, showModal, closeModal }: ApiData) {
  const toast = useToast();
  const [form, setForm] = React.useState({ category: "fuel", amount: "", note: "", date: new Date().toISOString().slice(0, 10) });
  const expenses = data.expenses ?? [];
  const total = expenses.reduce((a: number, e: ApiData) => a + e.amount, 0);

  const add = async () => {
    try {
      await api("/api/admin/expenses", { method: "POST", body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
      toast.push("Expense added");
      setForm({ category: "fuel", amount: "", note: "", date: new Date().toISOString().slice(0, 10) });
      closeModal();
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await api("/api/admin/expenses", { method: "DELETE", body: JSON.stringify({ id }) });
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  const byCat = expenses.reduce((acc: ApiData, e: ApiData) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Card className="flex items-center gap-3 px-5 py-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Wallet className="size-4.5" /></div>
          <div>
            <p className="text-xs text-ink-400">Total recorded</p>
            <p className="font-display font-bold text-ink-900">{formatINR(total)}</p>
          </div>
        </Card>
        <Button onClick={onAdd}>+ Add expense</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="space-y-2">
            {expenses.map((e: ApiData) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                <div>
                  <p className="text-sm font-semibold capitalize text-ink-800">{e.category}</p>
                  <p className="text-[11px] text-ink-400">{e.note} · {e.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink-900">{formatINR(e.amount)}</span>
                  <button onClick={() => remove(e.id)} className="text-ink-300 hover:text-stop-500"><Trash2 className="size-4" /></button>
                </div>
              </div>
            ))}
            {expenses.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No expenses yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-sm font-bold text-ink-900">By category</h3>
          <div className="mt-3 space-y-2.5">
            {Object.entries(byCat).map(([cat, amt]) => (
              <div key={cat}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="capitalize text-ink-600">{cat}</span>
                  <span className="font-semibold text-ink-800">{formatINR(amt as number)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${total ? ((amt as number) / total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={showModal} onClose={closeModal} title="Add expense">
        <div className="space-y-3">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="fuel">Fuel</option>
            <option value="maintenance">Maintenance</option>
            <option value="insurance">Insurance</option>
            <option value="marketing">Marketing</option>
            <option value="rent">Rent</option>
            <option value="salary">Salary</option>
            <option value="other">Other</option>
          </Select>
          <Input type="number" placeholder="Amount (₹)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Button onClick={add} className="w-full">Save expense</Button>
        </div>
      </Modal>
    </div>
  );
}

function PayrollView({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const toast = useToast();
  const [sel, setSel] = React.useState<string>("");
  const [form, setForm] = React.useState({ month: new Date().toISOString().slice(0, 7), lessons: "0", base: "0", bonus: "0", commission: "0" });
  const payroll = data.payroll ?? [];
  const instructors = data.instructors ?? [];
  const monthTotal = payroll.filter((p: ApiData) => p.month === form.month).reduce((a: number, p: ApiData) => a + p.total, 0);

  const pick = (id: string) => {
    setSel(id);
    const existing = payroll.find((p: ApiData) => p.instructorId === id && p.month === form.month);
    if (existing) setForm({ month: existing.month, lessons: String(existing.lessons), base: String(existing.base), bonus: String(existing.bonus), commission: String(existing.commission) });
    else setForm((f) => ({ ...f, lessons: "0", base: "0", bonus: "0", commission: "0" }));
  };

  const save = async () => {
    if (!sel) return;
    try {
      await api("/api/admin/payroll", { method: "POST", body: JSON.stringify({ instructorId: sel, ...form }) });
      toast.push("Payroll saved");
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete payroll entry?")) return;
    try {
      await api("/api/admin/payroll", { method: "DELETE", body: JSON.stringify({ id }) });
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5">
        <h3 className="font-display text-sm font-bold text-ink-900">Run payroll</h3>
        <div className="mt-3 space-y-3">
          <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
          <Select value={sel} onChange={(e) => pick(e.target.value)}>
            <option value="">Select instructor...</option>
            {instructors.map((i: ApiData) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </Select>
          {sel && (
            <div className="space-y-2 rounded-xl bg-ink-50 p-3">
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" label="Lessons" value={form.lessons} onChange={(e) => setForm({ ...form, lessons: e.target.value })} />
                <Input type="number" label="Commission" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} />
                <Input type="number" label="Base" value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} />
                <Input type="number" label="Bonus" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
              </div>
              <p className="text-right text-sm font-bold text-ink-900">{formatINR(Number(form.base) + Number(form.bonus) + Number(form.commission))}</p>
            </div>
          )}
          <Button onClick={save} disabled={!sel} className="w-full">Save payroll</Button>
        </div>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-ink-900">{new Date(form.month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h3>
          <span className="text-xs font-semibold text-ink-500">Total: {formatINR(monthTotal)}</span>
        </div>
        <div className="mt-3 space-y-2">
          {payroll.filter((p: ApiData) => p.month === form.month).map((p: ApiData) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
              <div>
                <p className="text-sm font-semibold text-ink-800">{p.instructor}</p>
                <p className="text-[11px] text-ink-400">{p.lessons} lessons · base {formatINR(p.base)} · commission {formatINR(p.commission)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink-900">{formatINR(p.total)}</span>
                <button onClick={() => remove(p.id)} className="text-ink-300 hover:text-stop-500"><Trash2 className="size-4" /></button>
              </div>
            </div>
          ))}
          {payroll.filter((p: ApiData) => p.month === form.month).length === 0 && <p className="py-8 text-center text-sm text-ink-400">No payroll entries for this month.</p>}
        </div>
      </Card>
    </div>
  );
}
