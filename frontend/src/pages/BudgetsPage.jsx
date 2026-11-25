import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import FormField from "../components/FormField";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import StatCard from "../components/StatCard";
import { useToast } from "../context/ToastContext";
import useFetch from "../hooks/useFetch";
import { budgetService, eventService } from "../services/endpoints";
import { formatDate, formatMoney, getErrorMessage } from "../utils/format";

const CATEGORIES = ["Venue", "Food", "Prizes", "Certificates", "Other"];
const today = () => new Date().toISOString().slice(0, 10);

export default function BudgetsPage() {
  const toast = useToast();
  const events = useFetch(() => eventService.all(), []);
  const budgets = useFetch(() => budgetService.budgets(), []);
  const [selectedId, setSelectedId] = useState("");
  const expenses = useFetch(() => (selectedId ? budgetService.expenses({ event: selectedId }) : Promise.resolve([])), [selectedId]);

  const [newBudget, setNewBudget] = useState({ event: "", allocated_amount: "" });
  const [expense, setExpense] = useState({ category: "Venue", description: "", amount: "", expense_date: today() });
  const [deleting, setDeleting] = useState(null);

  const budget = budgets.data?.find((b) => String(b.event) === String(selectedId));
  const eventsWithoutBudget = events.data?.filter((e) => !budgets.data?.some((b) => b.event === e.id)) || [];

  const refreshAll = () => {
    budgets.reload();
    expenses.reload();
  };

  const createBudget = async (e) => {
    e.preventDefault();
    try {
      const created = await budgetService.createBudget(newBudget);
      toast.success("Budget created.");
      setNewBudget({ event: "", allocated_amount: "" });
      await budgets.reload();
      setSelectedId(String(created.event));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      await budgetService.createExpense({ ...expense, event: Number(selectedId) });
      toast.success("Expense added.");
      setExpense({ ...expense, description: "", amount: "" });
      refreshAll();
    } catch (err) {
      toast.error(getErrorMessage(err)); // e.g. "Exceeds the event budget. Only 500 remaining."
    }
  };

  const removeExpense = async () => {
    try {
      await budgetService.deleteExpense(deleting.id);
      toast.success("Expense deleted.");
      refreshAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setDeleting(null);
  };

  if (events.loading || budgets.loading) return <Loader />;
  const used = Math.min(Number(budget?.utilization_percent || 0), 100);

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold">Budgets &amp; Expenses</h2>
      <ErrorMessage message={events.error || budgets.error} />

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <form className="card space-y-4" onSubmit={createBudget}>
          <h3 className="card-title">Create event budget</h3>
          <FormField as="select" label="Event" required value={newBudget.event} onChange={(e) => setNewBudget({ ...newBudget, event: e.target.value })}>
            <option value="">Select event...</option>
            {eventsWithoutBudget.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </FormField>
          <FormField label="Allocated amount (₹)" type="number" min="0" step="0.01" required value={newBudget.allocated_amount}
            onChange={(e) => setNewBudget({ ...newBudget, allocated_amount: e.target.value })} />
          <button className="btn btn-primary">Create budget</button>
        </form>

        <div className="card space-y-4">
          <h3 className="card-title">View budget</h3>
          <FormField as="select" label="Event" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select event with a budget...</option>
            {budgets.data?.map((b) => <option key={b.id} value={b.event}>{b.event_title}</option>)}
          </FormField>
          {budgets.data?.length === 0 && <p className="text-sm text-slate-500">No budgets created yet.</p>}
        </div>
      </div>

      {budget && (
        <>
          <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Allocated" value={formatMoney(budget.allocated_amount)} />
            <StatCard label="Total Expenses" value={formatMoney(budget.total_expenses)} tone="orange" />
            <StatCard label="Remaining" value={formatMoney(budget.remaining_budget)} tone="green" />
            <StatCard label="Utilization" value={`${budget.utilization_percent}%`} tone="purple" />
          </div>
          <div className="mb-6 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-3 rounded-full ${used > 90 ? "bg-red-500" : "bg-indigo-500"}`} style={{ width: `${used}%` }} />
          </div>

          <form className="card mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={addExpense}>
            <select className="input" aria-label="Category" value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="input" placeholder="Description" value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} />
            <input className="input" type="number" min="0.01" step="0.01" placeholder="Amount (₹)" required value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} />
            <input className="input" type="date" required value={expense.expense_date} onChange={(e) => setExpense({ ...expense, expense_date: e.target.value })} />
            <button className="btn btn-primary">Add expense</button>
          </form>

          {expenses.loading && <Loader />}
          {!expenses.loading && expenses.data?.length === 0 && <EmptyState title="No expenses yet" />}
          {expenses.data?.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50"><tr><th className="th">Date</th><th className="th">Category</th><th className="th">Description</th><th className="th">Amount</th><th className="th">Added by</th><th className="th" /></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.data.map((x) => (
                    <tr key={x.id} className="hover:bg-slate-50">
                      <td className="td">{formatDate(x.expense_date)}</td>
                      <td className="td">{x.category}</td>
                      <td className="td">{x.description || "-"}</td>
                      <td className="td font-medium">{formatMoney(x.amount)}</td>
                      <td className="td">{x.added_by_name || "-"}</td>
                      <td className="td"><button className="btn btn-sm btn-danger" onClick={() => setDeleting(x)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {!budget && selectedId === "" && budgets.data?.length > 0 && <EmptyState title="Select an event" text="Pick an event above to see its budget and expenses." />}
      {deleting && <ConfirmDialog message={`Delete this ${formatMoney(deleting.amount)} ${deleting.category} expense?`} onConfirm={removeExpense} onCancel={() => setDeleting(null)} />}
    </>
  );
}
