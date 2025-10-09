import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '@/lib/auth-context';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Marian College Student Portal",
  description: "Student Portal for Marian College of Baliuag, Inc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-poppins antialiased bg-white text-black`}
      >
        <AuthProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="!font-poppins !text-xs !font-medium !shadow-lg !border-l-4"
            progressClassName="!bg-blue-900"
            className="!font-poppins"
            style={{ fontFamily: 'Poppins', fontSize: '12px' }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
