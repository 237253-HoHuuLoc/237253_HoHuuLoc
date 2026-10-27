import { useEffect, useState } from 'react';
 
// Dev: /api duoc Vite proxy sang localhost:5000.
// Production: build image voi --build-arg VITE_API_URL=https://api-...onrender.com/api
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const EMPTY = {
  employeeId: '', fullName: '', gender: 'Nam', dateOfBirth: '',
  department: '', position: '', email: '', phone: '',
  hireDate: '', status: 'Đang làm việc'
};
const FIELDS = [
  ['employeeId', 'Mã nhân viên', 'text', true],
  ['fullName', 'Họ tên', 'text', true],
  ['gender', 'Giới tính', 'select', false],
  ['dateOfBirth', 'Ngày sinh', 'date', false],
  ['department', 'Phòng ban', 'text', false],
  ['position', 'Chức vụ', 'text', false],
  ['email', 'Email', 'email', true],
  ['phone', 'Điện thoại', 'tel', false],
  ['hireDate', 'Ngày vào làm', 'date', false],
  ['status', 'Trạng thái', 'select', false]
];
 
export default function App() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
 
  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || `Lỗi HTTP ${response.status}`);
    return body;
  }
 
  async function loadEmployees(value = search) {
    setLoading(true);
    setError('');
    try {
      const q = value ? `?search=${encodeURIComponent(value)}` : '';
      setEmployees(await request(`/employees${q}`));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
 
  useEffect(() => { loadEmployees(''); }, []);
 
  function edit(employee) {
    const { _id, createdAt, updatedAt, __v, ...details } = employee;
    setEditingId(_id);
    setForm({ ...EMPTY, ...details });
    setSelected(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
 
  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }
 
  async function save(e) {
    e.preventDefault();
    setMessage(''); setError('');
    if (!form.employeeId.trim() || !form.fullName.trim() || !form.email.trim()) {
      setError('Hãy nhập mã nhân viên, họ tên và email.'); return;
    }
    try {
      const result = await request(`/employees${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form)
      });
      setMessage(result.message || 'Lưu thành công.');
      reset();
      await loadEmployees();
    } catch (err) { setError(err.message); }
  }
 
  async function remove(employee) {
    if (!window.confirm(`Bạn chắc chắn muốn xóa ${employee.fullName}?`)) return;
    setError(''); setMessage('');
    try {
      const result = await request(`/employees/${employee._id}`, { method: 'DELETE' });
      setMessage(result.message || 'Đã xóa.');
      if (selected?._id === employee._id) setSelected(null);
      await loadEmployees();
    } catch (err) { setError(err.message); }
  }
 
  async function view(employee) {
    setError('');
    try { setSelected(await request(`/employees/${employee._id}`)); }
    catch (err) { setError(err.message); }
  }
 
  return <div className="container">
    <header>
      <h1>Quản lý nhân sự</h1>
      <p>Bài thi thực hành Điện toán đám mây • MSSV 237253</p>
    </header>
    {message && <p className="notice success">{message}</p>}
    {error && <p className="notice error">{error}</p>}
 
    <section className="panel">
      <h2>{editingId ? 'Cập nhật hồ sơ' : 'Thêm nhân viên'}</h2>
      <form onSubmit={save} className="form-grid">
        {FIELDS.map(([key, label, type, required]) => <label key={key}>
          <span>{label}{required ? ' *' : ''}</span>
          {type === 'select' ? <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}>
            {(key === 'gender' ? ['Nam', 'Nữ', 'Khác'] : ['Đang làm việc', 'Nghỉ việc', 'Tạm nghỉ']).map(x => <option key={x}>{x}</option>)}
          </select> : <input type={type} required={required} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />}
        </label>)}
        <div className="actions wide"><button type="submit">{editingId ? 'Lưu thay đổi' : 'Thêm nhân viên'}</button>
          <button type="button" className="secondary" onClick={reset}>Làm mới biểu mẫu</button></div>
      </form>
    </section>
 
    <section className="panel">
      <h2>Danh sách nhân viên ({employees.length})</h2>
      <form className="search" onSubmit={e => { e.preventDefault(); loadEmployees(); }}>
        <input placeholder="Tìm mã hoặc họ tên..." value={search} onChange={e => setSearch(e.target.value)} />
        <button type="submit">Tìm kiếm</button>
        <button className="secondary" type="button" onClick={() => { setSearch(''); loadEmployees(''); }}>Tất cả</button>
      </form>
      {loading ? <p>Đang tải danh sách...</p> : <div className="table-wrap"><table>
        <thead><tr><th>Mã</th><th>Họ tên</th><th>Phòng ban</th><th>Chức vụ</th><th>Email</th><th>Điện thoại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{employees.map(employee => <tr key={employee._id}>
          <td>{employee.employeeId}</td><td>{employee.fullName}</td><td>{employee.department}</td>
          <td>{employee.position}</td><td>{employee.email}</td><td>{employee.phone}</td><td>{employee.status}</td>
          <td><div className="row-actions"><button onClick={() => view(employee)}>Xem</button>
            <button onClick={() => edit(employee)}>Sửa</button><button className="danger" onClick={() => remove(employee)}>Xóa</button></div></td>
        </tr>)}
        {!employees.length && <tr><td colSpan="8">Chưa có nhân viên phù hợp.</td></tr>}</tbody>
      </table></div>}
    </section>
 
    {selected && <section className="panel"><h2>Thông tin chi tiết</h2>
      <dl className="details">{FIELDS.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{selected[key] || '—'}</dd></div>)}</dl>
      <button className="secondary" onClick={() => setSelected(null)}>Đóng</button>
    </section>}
  </div>;
}