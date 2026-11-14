import type { ReactNode } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

export interface AuthMessage {
  type: "error" | "success";
  text: string;
}

interface AuthCardProps {
  subtitle: string;
  message?: AuthMessage | null;
  children: ReactNode;
}

/** Moldura das telas de acesso (mesmo visual do login). */
export default function AuthCard({ subtitle, message, children }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif mb-2">DK Fashion</h1>
          <p className="text-gray-500 text-sm mt-2">{subtitle}</p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-8">
          {message && (
            <div
              role={message.type === "error" ? "alert" : "status"}
              className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${
                message.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-green-50 text-green-600 border border-green-100"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0" />
              )}
              {message.text}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export const authInputClassName =
  "w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a]";
