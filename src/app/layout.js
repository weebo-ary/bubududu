import Soundtrack from "@/components/soundtrack";
import "./globals.css";
import { Shell } from "@/components/love-app";
export const metadata = {
  title: "bubududu — our little world",
  description: "A little corner of the universe, made for the two of us.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
        <Soundtrack />
      </body>
    </html>
  );
}
