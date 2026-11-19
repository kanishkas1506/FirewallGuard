
import { useState, useEffect, useCallback } from "react";

import {
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  List,
  Activity,
  Lock,
  Trash2,
  Menu,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pencil,
  Save,
  XCircle,
  Filter,
} from "lucide-react";

import "./App.css";

const API = "http://localhost:5000/api/firewall";

const initialForm = {
  ruleName: "",
  sourceIP: "",
  destinationIP: "",
  port: "",
  protocol: "TCP",
  action: "Allow",
};

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const [rules, setRules] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    active: 0,
    blocked: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  // FETCH RULES AND STATISTICS
  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [rulesResponse, statsResponse] = await Promise.all([
        fetch(`${API}/all`),
        fetch(`${API}/stats`),
      ]);

      if (!rulesResponse.ok || !statsResponse.ok) {
        throw new Error("Unable to fetch backend data.");
      }

      const rulesData = await rulesResponse.json();
      const statsData = await statsResponse.json();

      setRules(rulesData.rules || []);

      setStats({
        total: statsData.stats?.total || 0,
        valid: statsData.stats?.valid || 0,
        invalid: statsData.stats?.invalid || 0,
        active: statsData.stats?.active || 0,
        blocked: statsData.stats?.blocked || 0,
      });

    } catch (err) {
      setError(
        "Backend connection failed. Check whether server is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // INITIAL DATA LOAD
  useEffect(() => {
    loadData();
  }, [loadData]);

  // HANDLE FORM INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "protocol" && value === "ICMP"
        ? { port: "" }
        : {}),
    }));
  };

  // RESET FORM
  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  // CREATE OR UPDATE RULE
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const payload = {
      ...form,
      ruleName: form.ruleName.trim(),
      sourceIP: form.sourceIP.trim(),
      destinationIP: form.destinationIP.trim(),
      port:
        form.protocol === "ICMP" || form.port === ""
          ? null
          : Number(form.port),
    };

    try {
      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing ? `${API}/${editingId}` : `${API}/add`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.validation?.errors?.join(" ") ||
          data.message ||
          "Firewall rule validation failed."
        );
        return;
      }

      resetForm();

      await loadData();

      setSuccess(
        isEditing
          ? "Firewall rule updated successfully."
          : "Firewall rule created successfully."
      );

      setActivePage("All Rules");

    } catch (err) {
      setError("Unable to connect to backend server.");
    }
  };

  // OPEN EDIT FORM
  const editRule = (rule) => {
    setEditingId(rule._id);

    setForm({
      ruleName: rule.ruleName || "",
      sourceIP: rule.sourceIP || "",
      destinationIP: rule.destinationIP || "",
      port: rule.port ?? "",
      protocol: rule.protocol || "TCP",
      action: rule.action || "Allow",
    });

    setError("");
    setSuccess("");
    setActivePage("Add Rule");
  };

  // DELETE RULE
  const deleteRule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Delete failed.");
      }

      await loadData();

      setSuccess("Firewall rule deleted successfully.");

    } catch (err) {
      setError(err.message || "Unable to delete rule.");
    }
  };

  // SIDEBAR MENU
  const pages = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Add Rule", icon: PlusCircle },
    { name: "All Rules", icon: List },
    { name: "Validation", icon: ShieldCheck },
    { name: "History", icon: Activity },
  ];

  // DASHBOARD STATISTICS
  const statCards = [
    { title: "Total Rules", value: stats.total, icon: ShieldCheck },
    { title: "Valid Rules", value: stats.valid, icon: CheckCircle2 },
    { title: "Invalid Rules", value: stats.invalid, icon: AlertCircle },
    { title: "Active Rules", value: stats.active, icon: Activity },
    { title: "Blocked Rules", value: stats.blocked, icon: Lock },
  ];

  const validationResults = rules;

  const history = [...rules].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "show" : ""}`}>

        <div className="brand">
          <ShieldCheck size={30} />
          <h2>FirewallGuard</h2>

          <button
            className="close-menu"
            onClick={() => setMenuOpen(false)}
          >
            <X />
          </button>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav>
          {pages.map((page) => {
            const Icon = page.icon;

            return (
              <button
                key={page.name}
                className={
                  activePage === page.name
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => {
                  if (page.name === "Add Rule") {
                    resetForm();
                  }

                  setActivePage(page.name);
                  setMenuOpen(false);
                  setError("");
                  setSuccess("");
                }}
              >
                <Icon size={19} />
                {page.name}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <ShieldCheck size={22} />
          <div>
            <strong>Firewall Protection</strong>
            <p>Rule Validation Active</p>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOPBAR */}
        <header className="topbar">

          <button
            className="menu-button"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </button>

          <div>
            <h3>{activePage}</h3>
            <p>Firewall Rule Management System</p>
          </div>

          <div className="admin">
            <div className="admin-avatar">A</div>
            <span>Administrator</span>
          </div>

        </header>

        {/* GLOBAL MESSAGES */}
        {error && (
          <div className="page">
            <p className="error-message">{error}</p>
          </div>
        )}

        {success && (
          <div className="page">
            <p style={{ color: "green", fontSize: "14px" }}>
              {success}
            </p>
          </div>
        )}

        {loading && (
          <div className="page">
            <p>Loading data from MongoDB...</p>
          </div>
        )}

        {/* DASHBOARD */}
        {activePage === "Dashboard" && (
          <section className="page">

            <div className="welcome">
              <div>
                <h1>Security Dashboard</h1>
                <p>Monitor and manage your firewall rules.</p>
              </div>

              <button
                className="primary-button"
                onClick={() => {
                  resetForm();
                  setActivePage("Add Rule");
                }}
              >
                <PlusCircle size={18} />
                Add New Rule
              </button>
            </div>

            <div className="stats-grid">
              {statCards.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div className="stat-card" key={stat.title}>
                    <div className="stat-icon">
                      <Icon size={23} />
                    </div>

                    <p>{stat.title}</p>
                    <h2>{stat.value}</h2>
                  </div>
                );
              })}
            </div>

            <RuleTable
              rules={rules}
              onEdit={editRule}
              onDelete={deleteRule}
            />

          </section>
        )}

        {/* ADD / EDIT RULE */}
        {activePage === "Add Rule" && (
          <section className="page">

            <div className="welcome">
              <div>
                <h1>
                  {editingId ? "Edit Firewall Rule" : "Create Firewall Rule"}
                </h1>

                <p>
                  {editingId
                    ? "Update the existing firewall rule."
                    : "Enter network details to create a rule."}
                </p>
              </div>
            </div>

            <form className="rule-form" onSubmit={handleSubmit}>

              <div className="form-grid">

                <div className="field full">
                  <label>Rule Name</label>
                  <input
                    required
                    minLength="3"
                    maxLength="50"
                    name="ruleName"
                    placeholder="Example: Allow HTTP Traffic"
                    value={form.ruleName}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label>Source IP Address</label>
                  <input
                    required
                    name="sourceIP"
                    placeholder="192.168.1.10"
                    value={form.sourceIP}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label>Destination IP Address</label>
                  <input
                    required
                    name="destinationIP"
                    placeholder="192.168.1.20"
                    value={form.destinationIP}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label>Port Number</label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    name="port"
                    placeholder="443"
                    disabled={form.protocol === "ICMP"}
                    required={form.protocol !== "ICMP"}
                    value={form.port}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label>Protocol</label>
                  <select
                    name="protocol"
                    value={form.protocol}
                    onChange={handleChange}
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                  </select>
                </div>

                <div className="field full">
                  <label>Firewall Action</label>
                  <select
                    name="action"
                    value={form.action}
                    onChange={handleChange}
                  >
                    <option value="Allow">Allow</option>
                    <option value="Deny">Deny</option>
                  </select>
                </div>

              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {editingId ? <Save size={18} /> : <ShieldCheck size={18} />}

                  {editingId
                    ? "Update Firewall Rule"
                    : "Validate and Create Rule"}
                </button>

                {editingId && (
                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => {
                      resetForm();
                      setError("");
                      setSuccess("");
                      setActivePage("All Rules");
                    }}
                  >
                    <XCircle size={18} />
                    Cancel Edit
                  </button>
                )}

              </div>

            </form>

          </section>
        )}

        {/* ALL RULES */}
        {activePage === "All Rules" && (
          <section className="page">

            <div className="welcome">
              <div>
                <h1>All Firewall Rules</h1>
                <p>Rules retrieved from MongoDB database.</p>
              </div>
            </div>

            <RuleTable
              rules={rules}
              onEdit={editRule}
              onDelete={deleteRule}
            />

          </section>
        )}

        {/* VALIDATION */}
        {activePage === "Validation" && (
          <section className="page">

            <div className="welcome">
              <div>
                <h1>Rule Validation</h1>
                <p>View valid and invalid firewall rule submissions.</p>
              </div>
            </div>

            <ValidationTable results={validationResults} />

          </section>
        )}

        {/* HISTORY */}
        {activePage === "History" && (
          <section className="page">

            <div className="welcome">
              <div>
                <h1>Activity History</h1>
                <p>View firewall rule submission records from MongoDB.</p>
              </div>
            </div>

            <HistoryTable history={history} />

          </section>
        )}

      </main>
    </div>
  );
}

// ==================================
// RULES TABLE WITH SEARCH AND FILTER
// ==================================

function RuleTable({ rules, onEdit, onDelete }) {

  const [searchTerm, setSearchTerm] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [validationFilter, setValidationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // SEARCH AND FILTER RULES
  const filteredRules = rules.filter((rule) => {

    const search = searchTerm.toLowerCase().trim();

    const matchesSearch = [
      rule.ruleName,
      rule.sourceIP,
      rule.destinationIP,
      rule.port,
      rule.protocol,
      rule.action,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(search)
    );

    const matchesProtocol =
      protocolFilter === "All" || rule.protocol === protocolFilter;

    const matchesAction =
      actionFilter === "All" || rule.action === actionFilter;

    const matchesValidation =
      validationFilter === "All" ||
      rule.validationStatus === validationFilter;

    const matchesStatus =
      statusFilter === "All" || rule.ruleStatus === statusFilter;

    return (
      matchesSearch &&
      matchesProtocol &&
      matchesAction &&
      matchesValidation &&
      matchesStatus
    );
  });

  // CLEAR ALL FILTERS
  const clearFilters = () => {
    setSearchTerm("");
    setProtocolFilter("All");
    setActionFilter("All");
    setValidationFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="table-card">

      <div className="table-heading">
        <div>
          <h2>Firewall Rules</h2>
          <p>Search, filter, edit and manage database records</p>
        </div>

        <Search size={20} />
      </div>

      {/* SEARCH */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        margin: "18px 0",
        flexWrap: "wrap"
      }}>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flex: "1",
          minWidth: "220px"
        }}>
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by name, IP, port, protocol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "11px",
              border: "1px solid #ddd",
              borderRadius: "6px"
            }}
          />
        </div>

      </div>

      {/* FILTERS */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        marginBottom: "18px"
      }}>

        <Filter size={18} />

        <select
          value={protocolFilter}
          onChange={(e) => setProtocolFilter(e.target.value)}
          aria-label="Filter by protocol"
        >
          <option value="All">All Protocols</option>
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
          <option value="ICMP">ICMP</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          aria-label="Filter by action"
        >
          <option value="All">All Actions</option>
          <option value="Allow">Allow</option>
          <option value="Deny">Deny</option>
        </select>

        <select
          value={validationFilter}
          onChange={(e) => setValidationFilter(e.target.value)}
          aria-label="Filter by validation"
        >
          <option value="All">All Validation</option>
          <option value="Valid">Valid</option>
          <option value="Invalid">Invalid</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
        </select>

        <button
          type="button"
          className="delete-button"
          onClick={clearFilters}
        >
          <XCircle size={16} />
          Clear Filters
        </button>

      </div>

      <p style={{ marginBottom: "12px", fontSize: "13px" }}>
        Showing {filteredRules.length} of {rules.length} rules
      </p>

      {/* RULES TABLE */}
      <div className="table-scroll">
        <table>

          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Port</th>
              <th>Protocol</th>
              <th>Action</th>
              <th>Validation</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty">
                  No matching firewall rules found.
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => (
                <tr key={rule._id}>

                  <td>{rule.ruleName}</td>
                  <td>{rule.sourceIP || "—"}</td>
                  <td>{rule.destinationIP || "—"}</td>
                  <td>{rule.port ?? "—"}</td>
                  <td>{rule.protocol || "—"}</td>
                  <td>{rule.action || "—"}</td>

                  <td>
                    <span
                      className={`status ${
                        rule.validationStatus === "Valid"
                          ? "valid"
                          : "blocked"
                      }`}
                    >
                      {rule.validationStatus || "—"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status ${
                        rule.ruleStatus === "Active"
                          ? "active-status"
                          : "blocked"
                      }`}
                    >
                      {rule.ruleStatus || "—"}
                    </span>
                  </td>

                  <td>
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center"
                    }}>

                      <button
                        type="button"
                        className="edit-button"
                        title="Edit rule"
                        onClick={() => onEdit(rule)}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        title="Delete rule"
                        onClick={() => onDelete(rule._id)}
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>

    </div>
  );
}

// ==================================
// VALIDATION TABLE
// ==================================

function ValidationTable({ results }) {
  return (
    <div className="table-card">

      <div className="table-heading">
        <div>
          <h2>Validation Results</h2>
          <p>Backend validation and DFA results</p>
        </div>

        <ShieldCheck size={20} />
      </div>

      <div className="table-scroll">
        <table>

          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Port</th>
              <th>Protocol</th>
              <th>Action</th>
              <th>Result</th>
              <th>Errors</th>
              <th>DFA Trace</th>
            </tr>
          </thead>

          <tbody>

            {results.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty">
                  No validation results available.
                </td>
              </tr>
            ) : (
              results.map((item) => (
                <tr key={item._id}>

                  <td>{item.ruleName}</td>
                  <td>{item.sourceIP || "—"}</td>
                  <td>{item.destinationIP || "—"}</td>
                  <td>{item.port ?? "—"}</td>
                  <td>{item.protocol || "—"}</td>
                  <td>{item.action || "—"}</td>

                  <td>
                    <span
                      className={`status ${
                        item.validationStatus === "Valid"
                          ? "valid"
                          : "blocked"
                      }`}
                    >
                      {item.validationStatus || "—"}
                    </span>
                  </td>

                  <td>
                    {item.validationErrors?.length
                      ? item.validationErrors.join(" ")
                      : "No errors"}
                  </td>

                  <td>
                    {Array.isArray(item.dfaTrace)
                      ? item.dfaTrace.join(" → ")
                      : "—"}
                  </td>

                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================================
// HISTORY TABLE
// ==================================

function HistoryTable({ history }) {
  return (
    <div className="table-card">

      <div className="table-heading">
        <div>
          <h2>Submission History</h2>
          <p>Firewall rule records stored in MongoDB</p>
        </div>

        <Clock size={20} />
      </div>

      <div className="table-scroll">
        <table>

          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Activity</th>
              <th>Validation</th>
              <th>Action</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>

            {history.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">
                  No submission history available.
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item._id}>

                  <td>{item.ruleName}</td>

                  <td>
                    {item.validationStatus === "Valid"
                      ? "Rule Submitted"
                      : "Validation Failed"}
                  </td>

                  <td>
                    <span
                      className={`status ${
                        item.validationStatus === "Valid"
                          ? "valid"
                          : "blocked"
                      }`}
                    >
                      {item.validationStatus || "—"}
                    </span>
                  </td>

                  <td>{item.action || "—"}</td>

                  <td>
                    {item.updatedAt &&
                    item.updatedAt !== item.createdAt
                      ? `Updated: ${new Date(
                          item.updatedAt
                        ).toLocaleString()}`
                      : item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "—"}
                  </td>

                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;