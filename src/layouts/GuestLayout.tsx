import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Scissors } from "lucide-react";

export default function GuestLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-50 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: "radial-gradient(circle, #1ABC71 1px, transparent 1px)",
                backgroundSize: "24px 24px"
            }} />

            <div className="relative z-10 w-full flex flex-col sm:justify-center items-center">
                <div>
                    <Link to="/" className="flex flex-col items-center gap-2">
                        <div className="h-16 w-16 rounded-2xl bg-[#1ABC71] flex items-center justify-center shadow-lg">
                            <Scissors className="h-8 w-8 text-white" />
                        </div>
                        <span className="font-bold text-2xl text-gray-900 mt-2">AI Viral Clipper</span>
                    </Link>
                </div>

                <div className="w-full sm:max-w-md mt-6 px-6 py-8 bg-white shadow-xl overflow-hidden sm:rounded-2xl border border-gray-100">
                    {children}
                </div>
            </div>
        </div>
    );
}
