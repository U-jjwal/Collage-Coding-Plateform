import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, UserPlus, Upload, Search, Filter, CheckCircle2,
  AlertCircle, Trash2, X, FileText, Download, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

const ManageEmails = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', role: '', isActive: '' });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', fullName: '', role: 'student', rollNumber: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // CSV Import states
  const [csvFile, setCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch authorized emails
  const fetchEmails = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search: filters.search || undefined,
        role: filters.role || undefined,
        isActive: filters.isActive !== '' ? filters.isActive : undefined,
      };
      const res = await adminService.getAuthorizedEmails(params);
      setEmails(res.data.data.authorizedEmails || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load authorized emails.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmails(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchEmails]);

  // Handle single email creation
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.email || !addForm.fullName || !addForm.role) {
      setAddError('Please complete all required fields.');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      await adminService.addAuthorizedEmail(addForm);
      toast.success('Authorized email added successfully!');
      setShowAddModal(false);
      setAddForm({ email: '', fullName: '', role: 'student', rollNumber: '' });
      fetchEmails(1);
    } catch (err) {
      setAddError(err.response?.data?.message || err.message || 'Failed to add authorized email.');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle status toggle
  const handleToggleActive = async (emailRecord) => {
    const newStatus = !emailRecord.isActive;
    // Optimistic update
    setEmails((prev) =>
      prev.map((item) => (item._id === emailRecord._id ? { ...item, isActive: newStatus } : item))
    );
    try {
      await adminService.updateAuthorizedEmail(emailRecord._id, { isActive: newStatus });
      toast.success(`${emailRecord.email} is now ${newStatus ? 'active' : 'deactivated'}.`);
    } catch (err) {
      // Revert on error
      setEmails((prev) =>
        prev.map((item) => (item._id === emailRecord._id ? { ...item, isActive: emailRecord.isActive } : item))
      );
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Handle delete
  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove "${email}" from the authorized list?`)) return;
    try {
      await adminService.deleteAuthorizedEmail(id);
      toast.success('Email removed from allowlist.');
      fetchEmails(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record.');
    }
  };

  // Handle CSV import
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please choose a CSV file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('file', csvFile);
    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await adminService.importEmails(formData);
      setImportResult(res.data.data);
      toast.success(res.data.message || 'CSV imported successfully!');
      fetchEmails(1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to import CSV.');
    } finally {
      setImportLoading(false);
    }
  };

  // Download sample CSV
  const handleDownloadSample = () => {
    const sample = `email,role,fullName,rollNumber\narav.sharma@college.edu,student,Aarav Sharma,CS001\npriya.verma@college.edu,teacher,Dr. Priya Verma,\nrahul.patel@college.edu,student,Rahul Patel,CS002`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_authorized_emails.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge-role-admin">Admin</span>;
      case 'teacher':
        return <span className="badge-role-teacher">Teacher</span>;
      default:
        return <span className="badge-role-student">Student</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Shield className="text-violet-400" size={26} />
            Authorized Emails Allowlist
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Control which email addresses are eligible to create accounts on the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCsvFile(null);
              setImportResult(null);
              setShowImportModal(true);
            }}
            className="btn-secondary"
          >
            <Upload size={16} />
            Bulk Import CSV
          </button>
          <button
            onClick={() => {
              setAddError('');
              setShowAddModal(true);
            }}
            className="btn-primary"
          >
            <UserPlus size={16} />
            Add Single Email
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by email, name, or roll number..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            className="input pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium pl-1">
            <Filter size={14} /> Filter:
          </div>

          <select
            value={filters.role}
            onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
            className="input py-2 text-xs w-auto cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={filters.isActive}
            onChange={(e) => setFilters((p) => ({ ...p, isActive: e.target.value }))}
            className="input py-2 text-xs w-auto cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          <button
            onClick={() => fetchEmails(pagination.page)}
            className="btn-ghost p-2 text-zinc-400 hover:text-zinc-200"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/60 border-b border-zinc-800 text-xs uppercase text-zinc-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Name & Roll No</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Added Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="spinner w-8 h-8 mx-auto mb-2" />
                    Loading authorized emails...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <Shield size={36} className="mx-auto mb-2 opacity-30" />
                    No authorized emails found matching your filters.
                  </td>
                </tr>
              ) : (
                emails.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white">{item.fullName}</div>
                      {item.rollNumber ? (
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">{item.rollNumber}</div>
                      ) : (
                        <div className="text-xs text-zinc-600">—</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-300 text-xs">
                      {item.email}
                    </td>
                    <td className="px-5 py-3.5">
                      {getRoleBadge(item.role)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          item.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
                            : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20 hover:bg-zinc-500/25'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(item._id, item.email)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove from allowlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && pagination.total > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchEmails(pagination.page - 1)}
                className="btn-secondary btn-sm disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="px-2 font-medium text-zinc-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchEmails(pagination.page + 1)}
                className="btn-secondary btn-sm disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Single Email Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full border-zinc-700 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus size={18} className="text-violet-400" />
              Authorize New Email
            </h3>
            <p className="text-zinc-400 text-xs mb-4">
              Allows this user to register with their pre-assigned role.
            </p>

            {addError && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label">Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Email Address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={addForm.email}
                  onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Role <span className="text-red-400">*</span></label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value }))}
                    className="input cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Roll Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CS2024-001"
                    value={addForm.rollNumber}
                    onChange={(e) => setAddForm((p) => ({ ...p, rollNumber: e.target.value }))}
                    className="input font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={addLoading}
                >
                  {addLoading ? 'Saving...' : 'Authorize Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-lg w-full border-zinc-700 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Upload size={18} className="text-violet-400" />
              Bulk Import Authorized Emails
            </h3>
            <p className="text-zinc-400 text-xs mb-4">
              Upload a CSV containing email addresses, assigned roles, and student names.
            </p>

            {/* Sample guide */}
            <div className="bg-zinc-800/60 border border-zinc-700/80 rounded-lg p-3 mb-4 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-zinc-200">Required CSV Columns:</span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1"
                >
                  <Download size={13} /> Download Sample
                </button>
              </div>
              <code className="text-zinc-400 font-mono block bg-zinc-900 px-2 py-1 rounded">
                email,role,fullName,rollNumber
              </code>
            </div>

            {/* Dropzone */}
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) setCsvFile(e.dataTransfer.files[0]);
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  csvFile
                    ? 'border-violet-500 bg-violet-500/5'
                    : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setCsvFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
                {csvFile ? (
                  <div className="flex flex-col items-center">
                    <FileText className="text-violet-400 mb-2" size={32} />
                    <p className="text-white text-sm font-medium">{csvFile.name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {(csvFile.size / 1024).toFixed(1)} KB — Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="text-zinc-500 mb-2" size={32} />
                    <p className="text-zinc-300 text-sm font-medium">
                      Drag and drop your .csv file here
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">or click to browse from your device</p>
                  </div>
                )}
              </div>

              {/* Import Results Banner */}
              {importResult && (
                <div className="space-y-2 animate-fade-in text-xs">
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    <CheckCircle2 size={16} />
                    <span>{importResult.inserted} new authorized email(s) successfully added.</span>
                  </div>

                  {importResult.duplicates?.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                      <span className="font-semibold">{importResult.duplicates.length} duplicate email(s) skipped:</span>
                      <div className="mt-1 text-[11px] text-amber-300/80 truncate">
                        {importResult.duplicates.join(', ')}
                      </div>
                    </div>
                  )}

                  {importResult.errors?.length > 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg max-h-36 overflow-y-auto">
                      <span className="font-semibold">{importResult.errors.length} row error(s):</span>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>
                            Row {err.row}: {err.reason} {err.email && `(${err.email})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="btn-secondary"
                  disabled={importLoading}
                >
                  {importResult ? 'Close' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!csvFile || importLoading}
                >
                  {importLoading ? 'Processing...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEmails;
