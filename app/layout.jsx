import "./globals.css";

export const metadata = {
  title: "RFID Box Dashboard",
  description: "Realtime RFID box scanner and dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
