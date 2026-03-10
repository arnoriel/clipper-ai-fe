import { useState } from "react";
import { Link } from "react-router-dom";
import GuestLayout from "../layouts/GuestLayout";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate login for now
        window.location.href = "/app";
    };

    return (
        <GuestLayout>
            {/* Session Status - normally handled by backend */}
            <form onSubmit={submit}>
                <div>
                    <label htmlFor="email" className="block font-medium text-sm text-gray-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-gray-300 focus:border-[#1ABC71] focus:ring-[#1ABC71] rounded-md shadow-sm mt-1 block w-full py-2 px-3 border"
                        required
                        autoFocus
                        autoComplete="username"
                    />
                </div>

                <div className="mt-4">
                    <label htmlFor="password" className="block font-medium text-sm text-gray-700">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-gray-300 focus:border-[#1ABC71] focus:ring-[#1ABC71] rounded-md shadow-sm mt-1 block w-full py-2 px-3 border"
                        required
                        autoComplete="current-password"
                    />
                </div>

                <div className="block mt-4">
                    <label htmlFor="remember_me" className="inline-flex items-center">
                        <input
                            id="remember_me"
                            type="checkbox"
                            name="remember"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="rounded border-gray-300 text-[#1ABC71] shadow-sm focus:ring-[#1ABC71]"
                        />
                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Link
                        to="/register"
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1ABC71] mr-4"
                    >
                        Belum punya akun?
                    </Link>

                    <a
                        href="#"
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1ABC71]"
                    >
                        Forgot your password?
                    </a>

                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-[#1ABC71] border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-[#16a085] focus:bg-[#16a085] active:bg-[#15967c] focus:outline-none focus:ring-2 focus:ring-[#1ABC71] focus:ring-offset-2 transition ease-in-out duration-150 ml-4"
                    >
                        Log in
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
