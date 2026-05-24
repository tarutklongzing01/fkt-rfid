import Link from "next/link";

export default function HomePage() {
  return (
    <main className="app-shell">
      <section className="panel scan-panel">
        <div className="brand">
          <h1 className="brand-title">RFID Box Dashboard</h1>
          <p className="brand-subtitle">สแกนกล่องและดูสรุปจำนวนแบบ realtime</p>
        </div>

        <div className="scan-buttons">
          <Link className="primary-button" href="/scan">
            ไปหน้า Scan
          </Link>
          <Link className="ghost-button" href="/dashboard">
            ไปหน้า Dashboard
          </Link>
          <Link className="ghost-button" href="/login">
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
