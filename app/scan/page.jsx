"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import AuthGate from "../../components/AuthGate";
import UserBar from "../../components/UserBar";
import boxMaster from "../../lib/boxMaster";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/useAuth";

const DEFAULT_STATION = "SCAN_STATION_01";
const SIGNAL_STORAGE_KEY = "rfid_signal_level";

function parseScan(scanCode) {
  const normalizedCode = scanCode.trim().toUpperCase();
  const masterCode = normalizedCode.split("-")[0] || "UNKNOWN";
  const master = boxMaster[masterCode];

  return {
    scanCode: normalizedCode,
    masterCode,
    master,
    payload: master || {
      category: "UNKNOWN",
      itemName: "ไม่พบข้อมูล",
      detail: "ไม่พบข้อมูลกล่องนี้",
      itemType: "UNKNOWN"
    }
  };
}

function getDocumentId(scanCode) {
  return scanCode.replaceAll("/", "__SLASH__");
}

function clampSignal(value) {
  return Math.min(100, Math.max(0, value));
}

function ScanContent() {
  const inputRef = useRef(null);
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [signalLevel, setSignalLevel] = useState(70);
  const [latest, setLatest] = useState(null);
  const [status, setStatus] = useState({
    type: "idle",
    text: "พร้อมสแกน"
  });

  useEffect(() => {
    const savedSignal = Number(window.localStorage.getItem(SIGNAL_STORAGE_KEY));

    if (!Number.isNaN(savedSignal)) {
      setSignalLevel(clampSignal(savedSignal));
    }

    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIGNAL_STORAGE_KEY, String(signalLevel));
  }, [signalLevel]);

  async function saveScan(rawCode) {
    const { scanCode, masterCode, master, payload } = parseScan(rawCode);

    if (!scanCode) {
      setStatus({ type: "warning", text: "กรุณาสแกนรหัส RFID" });
      inputRef.current?.focus();
      return;
    }

    setStatus({ type: "saving", text: "กำลังบันทึก..." });

    try {
      const ref = doc(db, "rfid_logs", getDocumentId(scanCode));
      const snapshot = await getDoc(ref);
      const data = {
        scanCode,
        masterCode,
        category: payload.category,
        itemName: payload.itemName,
        detail: payload.detail,
        itemType: payload.itemType,
        station: DEFAULT_STATION,
        signalLevel,
        scannedBy: user?.email || "UNKNOWN",
        scannedByUid: user?.uid || "UNKNOWN",
        updatedAt: serverTimestamp()
      };

      if (!snapshot.exists()) {
        data.createdAt = serverTimestamp();
      }

      await setDoc(ref, data, { merge: true });

      setLatest({
        scanCode,
        category: payload.category,
        itemName: payload.itemName,
        masterCode,
        signalLevel
      });
      setStatus({
        type: master ? "success" : "warning",
        text: master ? "บันทึกสำเร็จ" : "ไม่พบข้อมูลกล่องนี้ แต่บันทึกเป็น UNKNOWN แล้ว"
      });
      setValue("");
    } catch (error) {
      setStatus({
        type: "error",
        text: `บันทึกไม่สำเร็จ: ${error.message}`
      });
    } finally {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveScan(value);
  }

  function clearInput() {
    setValue("");
    setStatus({ type: "idle", text: "พร้อมสแกน" });
    inputRef.current?.focus();
  }

  function changeSignal(step) {
    setSignalLevel((current) => clampSignal(current + step));
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <h1 className="brand-title">Scan RFID</h1>
          <p className="brand-subtitle">รองรับ RFID Scanner แบบ Keyboard HID</p>
        </div>
        <nav className="nav-actions">
          <UserBar />
          <Link className="nav-link" href="/dashboard">
            Dashboard
          </Link>
        </nav>
      </header>

      <div className="scan-layout">
        <section className="panel scan-panel">
          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="scanCode">
              RFID Scan Code
            </label>
            <input
              ref={inputRef}
              id="scanCode"
              className="scan-input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoFocus
              autoComplete="off"
              inputMode="text"
              placeholder="FOAMBL-006769"
            />

            <div className="signal-control" aria-label="Signal level">
              <button className="signal-button" type="button" onClick={() => changeSignal(-5)}>
                -
              </button>
              <div className="signal-readout">
                <span className="metric-label">สัญญาณ</span>
                <strong>{signalLevel}%</strong>
                <div className="signal-track">
                  <span style={{ width: `${signalLevel}%` }} />
                </div>
              </div>
              <button className="signal-button" type="button" onClick={() => changeSignal(5)}>
                +
              </button>
            </div>

            <div className="scan-buttons">
              <button className="primary-button" type="submit" disabled={status.type === "saving"}>
                Save
              </button>
              <button className="ghost-button" type="button" onClick={clearInput}>
                Clear
              </button>
            </div>
          </form>
        </section>

        <aside className={`panel status-card status-${status.type}`}>
          <p className="status-line">
            <span className="status-dot" />
            {status.text}
          </p>

          <div className="metric-grid">
            <div className="metric">
              <p className="metric-label">รหัสล่าสุด</p>
              <p className="metric-value">{latest?.scanCode || "-"}</p>
            </div>
            <div className="metric">
              <p className="metric-label">Category ล่าสุด</p>
              <p className="metric-value">{latest?.category || "-"}</p>
            </div>
            <div className="metric">
              <p className="metric-label">Master Code</p>
              <p className="metric-value">{latest?.masterCode || "-"}</p>
            </div>
            <div className="metric">
              <p className="metric-label">สัญญาณล่าสุด</p>
              <p className="metric-value">{latest ? `${latest.signalLevel}%` : `${signalLevel}%`}</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function ScanPage() {
  return (
    <AuthGate>
      <ScanContent />
    </AuthGate>
  );
}
