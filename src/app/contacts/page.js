'use client';

import { useState } from 'react';

export default function Contacts() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();
      setSuccess(data.message);
      setError(null);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError('Ошибка отправки сообщения');
      setSuccess(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-text-dark mb-6">Контакты</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-text-dark mb-4">Свяжитесь с нами</h2>
          <p className="text-text-gray mb-2">Email: <a href="mailto:info@shikshakshop.com" className="text-accent-rose">...</a></p>
          <p className="text-text-gray mb-2">Телефон: <a href="tel:+992016960100" className="text-accent-rose">+992 01 696 0100</a></p>
          <p className="text-text-gray mb-2">Адрес: г. Худжанд, ул. Гафурова, д. А376</p>
          <p className="text-text-gray">Часы работы: Пн-Пт, 9:00–18:00</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-text-dark mb-4">Форма обратной связи</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2 border rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-2 border rounded"
              required
            />
            <textarea
              placeholder="Сообщение"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-2 border rounded h-32"
              required
            />
            <button type="submit" className="bg-accent-rose text-text-light px-4 py-2 rounded">
              Отправить
            </button>
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}