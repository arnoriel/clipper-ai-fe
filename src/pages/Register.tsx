import { useState } from "react";
import { Link } from "react-router-dom";
import GuestLayout from "../layouts/GuestLayout";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate register for now
        window.location.href = "/app";
    };

    return (
        <GuestLayout>
            <form onSubmit={submit}>
                <div>
                    <label htmlFor="name" className="block font-medium text-sm text-gray-700">
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-gray-300 focus:border-[#1ABC71] focus:ring-[#1ABC71] rounded-md shadow-sm mt-1 block w-full py-2 px-3 border"
                        required
                        autoFocus
                        autoComplete="name"
                    />
                </div>

                <div className="mt-4">
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
                        autoComplete="new-password"
                    />
                </div>

                <div className="mt-4">
                    <label htmlFor="password_confirmation" className="block font-medium text-sm text-gray-700">
                        Confirm Password
                    </label>
                    <input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        className="border-gray-300 focus:border-[#1ABC71] focus:ring-[#1ABC71] rounded-md shadow-sm mt-1 block w-full py-2 px-3 border"
                        required
                        autoComplete="new-password"
                    />
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Link
                        to="/login"
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1ABC71]"
                    >
                        Already registered?
                    </Link>

                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-[#1ABC71] border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-[#16a085] focus:bg-[#16a085] active:bg-[#15967c] focus:outline-none focus:ring-2 focus:ring-[#1ABC71] focus:ring-offset-2 transition ease-in-out duration-150 ml-4"
                    >
                        Register
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
