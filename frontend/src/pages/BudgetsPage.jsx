import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import StatCard from "../components/StatCard";
import useFetch from "../hooks/useFetch";
import { budgetService, eventService } from "../services/endpoints";
import { formatDate, formatMoney, getErrorMessage } from "../utils/format";

const CATEGORIES = ["Venue", "Food", "Prizes", "Certificates", "Other"];
const today = () => new Date().toISOString().slice(0, 10);

export default function BudgetsPage() {
  const events = useFetch(() => eventService.list(), []);
  const budgets = useFetch(() => budgetService.budgets(), []);
  const [selectedId, setSelectedId] = useState("");
  const expenses = useFetch(() => (selectedId ? budgetService.expenses({ event: selectedId }) : Promise.resolve([])), [selectedId]);

  const [newBudget, setNewBudget] = useState({ event: "", allocated_amount: "" });
  const [expense, setExpense] = useState({ category: "Venue", description: "", amount: "", expense_date: today() });
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  const budget = budgets.data?.find((b) => String(b.event) === String(selectedId));
  const eventsWithoutBudget = events.data?.filter((e) => !budgets.data?.some((b) => b.event === e.id)) || [];

  const refreshAll = () => {
    budgets.reload();
    expenses.reload();
  };

  const createBudget = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const created = await budgetService.createBudget(newBudget);
      setNewBudget({ event: "", allocated_amount: "" });
      await budgets.reload();
      setSelectedId(String(created.event));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await budgetService.createExpense({ ...expense, event: Number(selectedId) });
      setExpense({ ...expense, description: "", amount: "" });
      refreshAll();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const removeExpense = async () => {
    try {
      await budgetService.deleteExpense(deleting.id);
      setDeleting(null);
      refreshAll();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(null);
    }
  };

  if (events.loading || budgets.loading) return <Loader />;

  return (
    <>
      <div className="page-header"><h2>Budgets &amp; Expenses</h2></div>
      <ErrorMessage message={error || events.error || budgets.error} />

      <div className="grid-2 gap">
        <form className="card" onSubmit={createBudget}>
          <h3 className="card-title">Create event budget</h3>
          <label>Event
            <select required value={newBudget.event} onChange={(e) => setNewBudget({ ...newBudget, event: e.target.value })}>
              <option value="">Select event...</option>
              {eventsWithoutBudget.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </label>
          <label>Allocated amount (₹)
            <input type="number" min="0" step="0.01" required value={newBudget.allocated_amount} onChange={(e) => setNewBudget({ ...newBudget, allocated_amount: e.target.value })} />
          </label>
          <button className="btn btn-primary">Create budget</button>
        </form>

        <div className="card">
          <h3 className="card-title">View budget</h3>
          <label>Event
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Select event with a budget...</option>
              {budgets.data?.map((b) => <option key={b.id} value={b.event}>{b.event_title}</option>)}
            </select>
          </label>
          {budgets.data?.length === 0 && <p className="muted">No budgets created yet.</p>}
        </div>
      </div>

      {budget && (
        <>
          <div className="stats-grid">
            <StatCard label="Allocated" value={formatMoney(budget.allocated_amount)} />
            <StatCard label="Total Expenses" value={formatMoney(budget.total_expenses)} tone="orange" />
            <StatCard label="Remaining" value={formatMoney(budget.remaining_budget)} tone="green" />
            <StatCard label="Utilization" value={`${budget.utilization_percent}%`} tone="purple" />
          </div>
          <div className="progress"><div className="progress-fill" style={{ width: `${Math.min(Number(budget.utilization_percent), 100)}%` }} /></div>

          <form className="card inline-grid" onSubmit={addExpense}>
            <select value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input placeholder="Description" value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} />
            <input type="number" min="0.01" step="0.01" placeholder="Amount (₹)" required value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} />
            <input type="date" required value={expense.expense_date} onChange={(e) => setExpense({ ...expense, expense_date: e.target.value })} />
            <button className="btn btn-primary">Add expense</button>
          </form>

          {expenses.loading && <Loader />}
          {!expenses.loading && expenses.data?.length === 0 && <EmptyState title="No expenses yet" />}
          {expenses.data?.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Added by</th><th /></tr></thead>
                <tbody>
                  {expenses.data.map((x) => (
                    <tr key={x.id}>
                      <td data-label="Date">{formatDate(x.expense_date)}</td>
                      <td data-label="Category">{x.category}</td>
                      <td data-label="Description">{x.description || "-"}</td>
                      <td data-label="Amount">{formatMoney(x.amount)}</td>
                      <td data-label="Added by">{x.added_by_name || "-"}</td>
                      <td><button className="btn btn-sm btn-danger" onClick={() => setDeleting(x)}>Delete</button></td>
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
