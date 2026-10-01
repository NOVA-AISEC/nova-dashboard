import { useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { campusUsers } from '@/data/mock-data'
import { PageHeader } from '@/components/page-header'

export function UsersPage() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const filtered = campusUsers.filter(
    (user) =>
      (role === 'all' || user.role === role) &&
      `${user.name} ${user.team} ${user.accessScope}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Team & access"
        subtitle="Campus roster and assigned access. Role changes require a connected identity service."
      />
      <div className="queue-toolbar">
        <label className="workspace-search-input">
          <Search size={16} />
          <input
            aria-label="Search team"
            placeholder="Search a name, team, or permission…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select aria-label="Team role" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="all">All roles</option>
          {[...new Set(campusUsers.map((user) => user.role))].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <section className="workspace-panel">
        <div className="panel-header">
          <h2>
            Campus team <span className="count-pill">{filtered.length}</span>
          </h2>
          <span className="panel-meta">
            <ShieldCheck size={14} />
            Sample roster · Read only
          </span>
        </div>
        <div className="table-scroll">
          <table className="incident-table roster-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Team</th>
                <th>Access scope</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="roster-name">
                      <span className="avatar">
                        {user.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                      <strong>{user.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="context-tag">{user.role}</span>
                  </td>
                  <td>{user.team}</td>
                  <td>{user.accessScope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <strong>No matching team members</strong>
            <p>Try a different name or role.</p>
          </div>
        )}
      </section>
    </div>
  )
}
