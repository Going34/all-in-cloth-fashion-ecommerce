import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import StorefrontLayout from "./storefront-layout";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "All in cloth | Modern Fashion",
  description: "Redefining modern luxury through architectural silhouettes and ethical craftsmanship.",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <link rel="icon" type="image/x-icon" href="logo.png" />
      <body className={`${inter.variable} ${playfairDisplay.variable} antialiased bg-white text-neutral-900`}>

        <Providers>
          <StorefrontLayout>
            {children}
          </StorefrontLayout>
        </Providers>
      </body>
    </html>
  );
}
