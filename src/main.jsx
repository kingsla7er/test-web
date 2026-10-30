import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const MODES = [
  { label: 'Фокус', minutes: 25 },
  { label: 'Перерыв', minutes: 5 },
  { label: 'Долгий отдых', minutes: 15 },
];
const INITIAL_TASKS = [
  { id: 'first', text: 'Выбрать главное дело на сегодня', done: true },
  { id: 'second', text: 'Выделить 25 минут без отвлечений', done: false },
];

function readTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem('focus-tasks'));
    if (Array.isArray(saved) && saved.every(task => task && typeof task.id === 'string' && typeof task.text === 'string' && typeof task.done === 'boolean')) return saved;
  } catch { /* Storage may be unavailable in private browsing. */ }
  return INITIAL_TASKS;
}

function App() {
  const [mode, setMode] = useState(0);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [tasks, setTasks] = useState(readTasks);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const deadline = useRef(null);
  const finished = tasks.filter(task => task.done).length;
  const time = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  useEffect(() => {
    try { localStorage.setItem('focus-tasks', JSON.stringify(tasks)); }
    catch { setStorageError(true); }
  }, [tasks]);

  useEffect(() => {
    document.title = running ? `${time} · Фокус` : 'Фокус — одно дело за раз';
  }, [running, time]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        setNotice(mode === 0 ? 'Отличная работа! Самое время отдохнуть.' : 'Перерыв окончен. Можно вернуться к делам.');
      }
    };
    const interval = setInterval(tick, 250);
    tick();
    return () => clearInterval(interval);
  }, [running, mode]);

  function reset(nextMode = mode) {
    setRunning(false);
    setMode(nextMode);
    setRemaining(MODES[nextMode].minutes * 60);
    setNotice('');
  }

  function toggleTimer() {
    if (running) {
      setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
      setRunning(false);
    } else {
      const seconds = remaining || MODES[mode].minutes * 60;
      setRemaining(seconds);
      deadline.current = Date.now() + seconds * 1000;
      setNotice('');
      setRunning(true);
    }
  }

  function addTask(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    setTasks(previous => [...previous, { id: crypto.randomUUID(), text: draft.trim(), done: false }]);
    setDraft('');
  }

  return (
    <div className="page">
      <header className="header">
        <a className="brand" href="#" aria-label="Фокус — главная"><span className="brand-mark">◉</span> фокус<span className="brand-dot">.</span></a>
        <span className="header-note"><span className="status-dot" /> Пространство для ясных мыслей</span>
        <a className="github-link" href="https://github.com/kingsla7er/test-web" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
      </header>

      <main>
        <section className="intro">
          <p className="eyebrow"><span /> МЕНЬШЕ ШУМА. БОЛЬШЕ СМЫСЛА.</p>
          <h1>Одно дело.<br /><span className="title-last">Весь твой <span className="highlight">фокус<svg viewBox="0 0 350 16" preserveAspectRatio="none" aria-hidden="true"><path d="M4 10 Q160 -3 346 8" /></svg></span>.</span></h1>
          <p className="intro-copy">Выдохни. Выбери главное. Начни с 25 минут.<br />Большие вещи складываются из маленьких шагов.</p>
          <span className="intro-doodle" aria-hidden="true">✳</span>
        </section>

        <div className="workspace">
          <section className="timer-card" aria-label="Таймер для работы и отдыха">
            <div className="card-heading"><span className="eyebrow">ТВОЁ ВРЕМЯ</span><span className="mini-label"><span className="status-dot" /> {running ? 'В процессе' : 'Без спешки'}</span></div>
            <div className="tabs" role="group" aria-label="Режим таймера">
              {MODES.map((item, index) => <button key={item.label} className={mode === index ? 'tab active' : 'tab'} aria-pressed={mode === index} onClick={() => reset(index)}>{item.label}</button>)}
            </div>
            <div className="timer" role="timer" aria-label={`Осталось ${Math.floor(remaining / 60)} минут ${remaining % 60} секунд`}>{time}</div>
            <p className="timer-caption">{mode === 0 ? 'Сейчас есть только ты и твоё дело.' : 'Позволь себе немного ничего не делать.'}</p>
            <div className="timer-actions"><button className="start-button" onClick={toggleTimer}><span aria-hidden="true">{running ? 'Ⅱ' : '▶'}</span>{running ? 'Пауза' : remaining === 0 ? 'Ещё раз' : 'Начать'}</button><button className="reset-button" onClick={() => reset()} aria-label="Сбросить таймер">↺</button></div>
            <div className="session-note"><span aria-hidden="true">✦</span> Маленький шаг — тоже движение вперёд.</div>
            <p className="notice" role="status">{notice}</p>
          </section>

          <section className="tasks-card" aria-labelledby="tasks-title">
            <div className="tasks-heading"><div><p className="eyebrow">ОСВОБОДИ ГОЛОВУ</p><h2 id="tasks-title">На сегодня</h2></div><span className="task-count">{finished} / {tasks.length}</span></div>
            <p className="tasks-description">Запиши важное. Остальное подождёт.</p>
            <ul className="task-list">
              {tasks.map(task => <li key={task.id} className={task.done ? 'task done' : 'task'}><label><input type="checkbox" checked={task.done} onChange={() => setTasks(previous => previous.map(item => item.id === task.id ? { ...item, done: !item.done } : item))} /><span>{task.text}</span></label><button className="delete-task" aria-label={`Удалить задачу: ${task.text}`} onClick={() => setTasks(previous => previous.filter(item => item.id !== task.id))}>×</button></li>)}
              {tasks.length === 0 && <li className="empty-state">Чистый лист. С чего начнём?</li>}
            </ul>
            <form className="add-task" onSubmit={addTask}><input value={draft} maxLength={160} onChange={event => setDraft(event.target.value)} placeholder="Добавить маленький шаг…" aria-label="Новая задача" /><button type="submit" disabled={!draft.trim()} aria-label="Добавить задачу">+</button></form>
            <p className="storage-note">{storageError ? 'Хранилище недоступно: задачи сохранятся только до закрытия страницы.' : 'Твои задачи сохраняются в этом браузере.'}</p>
          </section>
        </div>

        <aside className="quote"><span aria-hidden="true">↳</span><p>Не обязательно успеть всё.<br /><strong>Достаточно сделать то, что важно.</strong></p><span className="quote-flower" aria-hidden="true">✽</span></aside>
      </main>
      <footer><span>Сделано для спокойных, продуктивных дней.</span><span>В своём темпе <span aria-hidden="true">↗</span></span></footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
