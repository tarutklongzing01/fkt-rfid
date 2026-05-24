# RFID Box Dashboard

เว็บ Next.js App Router สำหรับรับ RFID Scanner แบบ Keyboard HID, บันทึกลง Firebase Firestore, Login ด้วย Firebase Auth และแสดง Dashboard แบบ realtime

## ติดตั้ง

```bash
npm install
```

## สร้าง Firebase Project

1. เข้า Firebase Console
2. กด Add project
3. ตั้งชื่อโปรเจกต์
4. สร้าง Web App แล้วคัดลอก Firebase Config

## เปิด Firestore Database

1. ไปที่เมนู Firestore Database
2. กด Create database
3. เลือกโหมดเริ่มต้นสำหรับทดสอบ
4. เลือก region ที่ต้องการ
5. ใช้ collection ชื่อ `rfid_logs`

## เปิดระบบ Login

1. ไปที่เมนู Authentication
2. เลือก Sign-in method
3. เปิด provider แบบ Email/Password
4. ผู้ใช้สามารถสมัครผ่านหน้า `/login` หรือสร้าง user เองใน Firebase Console ก็ได้

## ตั้งค่า .env.local

คัดลอกไฟล์ `.env.local.example` เป็น `.env.local` แล้วใส่ค่าจาก Firebase Config

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Run Development

```bash
npm run dev
```

เปิดใช้งานได้ที่

- `http://localhost:3000/login`
- `http://localhost:3000/scan`
- `http://localhost:3000/dashboard`

## Deploy ไป Vercel

1. Push โปรเจกต์ขึ้น GitHub
2. Import repository ใน Vercel
3. ตั้งค่า Environment Variables ให้ครบเหมือน `.env.local`
4. Deploy

## Firestore Document

Collection: `rfid_logs`

```js
{
  scanCode: string,
  masterCode: string,
  category: string,
  itemName: string,
  detail: string,
  itemType: string,
  station: string,
  signalLevel: number,
  scannedBy: string,
  scannedByUid: string,
  createdAt: serverTimestamp,
  updatedAt: serverTimestamp
}
```

ปุ่มเพิ่ม-ลดสัญญาณในหน้า `/scan` เป็นค่าระดับสัญญาณสำหรับบันทึกประกอบ log (`signalLevel`) ไม่ได้ควบคุมกำลังส่งของเครื่อง RFID Scanner โดยตรง

ปุ่ม `Reset ทั้งหมด` ในหน้า `/dashboard` จะลบ document ทั้งหมดใน collection `rfid_logs` หลังจากผู้ใช้ยืนยันแล้ว

## Firestore Rules สำหรับทดสอบเท่านั้น

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rfid_logs/{docId} {
      allow read, write: if true;
    }
  }
}
```

Rules นี้ใช้ทดสอบเท่านั้น ถ้าใช้งานจริงควรล็อกให้อ่าน/เขียนได้เฉพาะผู้ที่ login แล้ว

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rfid_logs/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## หมายเหตุ

- หน้า `/scan` ใช้ `setDoc(doc(db, "rfid_logs", scanCode))` เพื่อกันข้อมูลซ้ำตาม RFID code
- ถ้า RFID เดิมถูกสแกนซ้ำ ระบบจะ update `updatedAt` และคง `createdAt` เดิมไว้
- Firestore document id ไม่รองรับเครื่องหมาย `/` จึง encode `/` เป็น `__SLASH__` เฉพาะ document id แต่ยังเก็บ `scanCode` จริงไว้ใน field ตามเดิม
