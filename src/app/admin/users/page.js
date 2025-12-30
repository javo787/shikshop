'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Загрузка клиентов...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-dark-teal">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Клиенты ({users.length})</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">← Назад в меню</Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
            <tr>
              <th className="p-4 border-b">Имя</th>
              <th className="p-4 border-b">Email</th>
              <th className="p-4 border-b">Телефон</th>
              <th className="p-4 border-b">Адрес доставки</th>
              <th className="p-4 border-b">Дата рег.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{user.name || 'Не указано'}</td>
                <td className="p-4 text-gray-500">{user.email}</td>
                <td className="p-4 text-blue-600 font-mono">
                  {user.phone ? (
                    <a href={`tel:${user.phone}`}>{user.phone}</a>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="p-4 text-sm max-w-xs truncate" title={user.address}>
                  {user.address || <span className="text-gray-300">Не заполнен</span>}
                </td>
                <td className="p-4 text-gray-400 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}