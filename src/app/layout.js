export const metadata = {
  title: "JosiahAI",
  description: "mabye yes, mabye no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}