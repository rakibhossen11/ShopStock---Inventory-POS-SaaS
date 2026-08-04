"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  UserCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  X, 
  CheckCircle2, 
  Loader2,
  QrCode
} from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";

interface StaffMember {
  id: string;
  staffCode?: string;
  name: string;
  email: string;
  role: "STORE_OWNER" | "MANAGER" | "CASHIER";
  createdAt: string;
}

export default function StaffPage() {
  const { user } = useAuthStore();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"MANAGER" | "CASHIER">("CASHIER");

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const result = await res.json();
      if (result.success) {
        setStaffList(result.data);
      }
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Staff member created successfully!");
        setName("");
        setEmail("");
        setPassword("");
        setRole("CASHIER");
        setModalOpen(false);
        fetchStaff();
      } else {
        setErrorMsg(data.error || "Failed to add staff member");
      }
    } catch (err) {
      setErrorMsg("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove ${staffName}?`)) return;

    try {
      const res = await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Staff member removed successfully!");
        fetchStaff();
      } else {
        alert(data.error || "Could not delete staff");
      }
    } catch (err) {
      alert("Error deleting staff");
    }
  };

  const isOwner = user?.role === "STORE_OWNER";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            Staff & Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your store members, custom employee IDs, and roles.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Staff</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Non-Owner Warning */}
      {!isOwner && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>You have View-Only access. Only Store Owners can add or remove staff.</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Loading staff accounts...
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No staff members found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Staff ID</th>
                  <th className="p-4">Staff Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined Date</th>
                  {isOwner && <th className="p-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5 w-max">
                        <QrCode className="w-3.5 h-3.5 text-slate-500" />
                        {member.staffCode || "N/A"}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {member.name[0]?.toUpperCase()}
                      </div>
                      <span>{member.name}</span>
                    </td>
                    <td className="p-4 text-slate-600 text-xs">{member.email}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          member.role === "STORE_OWNER"
                            ? "bg-purple-100 text-purple-800"
                            : member.role === "MANAGER"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {member.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    {isOwner && (
                      <td className="p-4 text-right">
                        {member.role !== "STORE_OWNER" && (
                          <button
                            onClick={() => handleDeleteStaff(member.id, member.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Staff"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Add New Staff
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Staff Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Rafiq Ahmed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 pl-9 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="rafiq@shopstock.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 pl-9 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 pl-9 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    minLength={6}
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Role / Permission *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "MANAGER" | "CASHIER")}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="CASHIER">CASHIER (POS & Sales Only)</option>
                  <option value="MANAGER">MANAGER (Stock, Sales & Reports)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? "Saving..." : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}