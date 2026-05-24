"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query, writeBatch } from "firebase/firestore";
import AuthGate from "../../components/AuthGate";
import UserBar from "../../components/UserBar";
import { db } from "../../lib/firebase";

function formatTimestamp(value) {
  if (!value) return "-";

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(date);
}

async function deleteAllLogs() {
  const snapshot = await getDocs(collection(db, "rfid_logs"));
  const docs = snapshot.docs;

  for (let index = 0; index < docs.length; index += 450) {
    const batch = writeBatch(db);
    docs.slice(index, index + 450).forEach((item) => {
      batch.delete(item.ref);
    });
    await batch.commit();
  }

  return docs.length;
}

function DashboardContent() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    const logsQuery = query(collection(db, "rfid_logs"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        setLogs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const summary = useMemo(() => {
    const map = new Map();

    logs.forEach((log) => {
      const category = log.category || "UNKNOWN";
      map.set(category, (map.get(category) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category, "th"));
  }, [logs]);

  const recentLogs = logs.slice(0, 20);

  async function handleResetAll() {
    if (logs.length === 0 || resetting) return;

    const confirmed = window.confirm(
      `ต้องการ Reset ข้อมูลสแกนทั้งหมด ${logs.length} รายการหรือไม่?\n\nการลบนี้จะลบข้อมูลใน Firestore collection rfid_logs`
    );

    if (!confirmed) return;

    setResetting(true);
    setResetMessage("กำลัง reset ข้อมูล...");

    try {
      const deletedCount = await deleteAllLogs();
      setResetMessage(`Reset สำเร็จ ลบข้อมูล ${deletedCount} รายการแล้ว`);
    } catch (resetError) {
      setResetMessage(`Reset ไม่สำเร็จ: ${resetError.message}`);
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <h1 className="brand-title">RFID Dashboard</h1>
          <p className="brand-subtitle">Summary แบบ realtime จาก Firestore</p>
        </div>
        <nav className="nav-actions">
          <UserBar />
          <button
            className="danger-button"
            type="button"
            onClick={handleResetAll}
            disabled={resetting || loading || logs.length === 0}
          >
            {resetting ? "Resetting..." : "Reset ทั้งหมด"}
          </button>
          <Link className="nav-link" href="/scan">
            Scan
          </Link>
        </nav>
      </header>

      <div className="dashboard-grid">
        <section className="panel summary-card">
          <div className="summary-head">
            <div>
              <h2 className="summary-title">Summary</h2>
              <p className="brand-subtitle">รวม {logs.length} แท็ก</p>
            </div>
            <div className="total-pill">Realtime</div>
          </div>

          {resetMessage ? <div className="action-message">{resetMessage}</div> : null}
          {error ? <div className="empty-state">อ่านข้อมูลไม่สำเร็จ: {error}</div> : null}
          {loading ? <div className="empty-state">กำลังโหลดข้อมูล...</div> : null}

          {!loading && !error && summary.length === 0 ? (
            <div className="empty-state">ยังไม่มีข้อมูลสแกน</div>
          ) : null}

          {summary.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Category</th>
                    <th>Total Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((item, index) => (
                    <tr key={item.category}>
                      <td>{index + 1}</td>
                      <td>{item.category}</td>
                      <td className="tag-total">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="panel summary-card">
          <div className="summary-head">
            <div>
              <h2 className="summary-title">สแกนล่าสุด</h2>
              <p className="brand-subtitle">แสดงรายการล่าสุด 20 รายการ</p>
            </div>
          </div>

          {recentLogs.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>scanCode</th>
                    <th>category</th>
                    <th>station</th>
                    <th>signal</th>
                    <th>updatedAt</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="recent-code">{log.scanCode}</td>
                      <td>{log.category || "UNKNOWN"}</td>
                      <td>{log.station || "-"}</td>
                      <td className="signal-cell">
                        {typeof log.signalLevel === "number" ? `${log.signalLevel}%` : "-"}
                      </td>
                      <td>{formatTimestamp(log.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">ยังไม่มีรายการล่าสุด</div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}
