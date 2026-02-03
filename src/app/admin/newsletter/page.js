'use client';
import { useState } from 'react';

export default function NewsletterPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState(''); // Здесь можно подключить Rich Text Editor
  const [isSending, setIsSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const handleSend = async (isTest = false) => {
    if (!confirm(isTest ? `Отправить тест на ${testEmail}?` : 'Вы уверены, что хотите отправить рассылку всем подписчикам?')) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            subject, 
            message,
            testEmail: isTest ? testEmail : null 
        }),
      });
      
      const data = await res.json();
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      alert('Ошибка отправки');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Рассылка новостей</h1>
      
      <div className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block mb-2 font-semibold">Тема письма</label>
          <input 
            type="text" 
            className="w-full border p-2 rounded" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Сообщение (HTML поддерживается)</label>
          <textarea 
            className="w-full border p-2 rounded h-40" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="<h1>Привет!</h1><p>У нас новости...</p>"
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-2">Тестовая отправка</h3>
          <div className="flex gap-2">
            <input 
                type="email" 
                placeholder="Email для теста"
                className="border p-2 rounded flex-1"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
            />
            <button 
                onClick={() => handleSend(true)}
                disabled={isSending}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
                Тест
            </button>
          </div>
        </div>

        <button 
            onClick={() => handleSend(false)}
            disabled={isSending || !subject || !message}
            className="w-full bg-blue-600 text-white p-3 rounded font-bold text-lg hover:bg-blue-700 mt-4"
        >
            {isSending ? 'Отправка...' : 'Отправить всем подписчикам'}
        </button>
      </div>
    </div>
  );
}