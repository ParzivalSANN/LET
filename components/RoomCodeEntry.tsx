import React, { useState } from 'react';
import { KeyIcon, ArrowRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface RoomCodeEntryProps {
    onJoinRoom: (pin: string, name: string, password: string) => void;
    onModeratorLogin: () => void;
}

export const RoomCodeEntry: React.FC<RoomCodeEntryProps> = ({ onJoinRoom, onModeratorLogin }) => {
    const [pin, setPin] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleJoin = () => {
        if (pin.length !== 4) {
            setError('Oda kodu 4 haneli olmalı!');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!name.trim() || password.length < 4) {
            setError('İsim ve şifre gerekli!');
            setTimeout(() => setError(''), 3000);
            return;
        }

        onJoinRoom(pin, name, password);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="bg-glass backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/10 w-full max-w-md relative overflow-hidden">

                {/* Decorative Glows */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-lg shadow-indigo-500/30">
                        <span className="text-3xl font-black text-white">LY</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                        Link<span className="text-indigo-400">Yarış</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">Oda kodunu gir ve katıl!</p>
                </div>

                {/* PIN Input */}
                <div className="space-y-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Oda Kodu</label>
                        <input
                            type="text"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="2847"
                            maxLength={4}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-2xl px-6 py-5 text-white text-3xl md:text-4xl font-black text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all tracking-[0.5em] placeholder-gray-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">İsmin</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ali"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••"
                            minLength={4}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600"
                        />
                        <p className="text-xs text-gray-500 ml-1">Min. 4 karakter</p>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm font-bold bg-red-900/20 p-3 rounded-xl text-center border border-red-500/20 animate-pulse">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        onClick={handleJoin}
                        disabled={pin.length !== 4 || !name.trim() || password.length < 4}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl group"
                    >
                        <span>Odaya Katıl</span>
                        <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Moderator Link */}
                <div className="pt-6 border-t border-white/10 text-center">
                    <button
                        onClick={onModeratorLogin}
                        className="text-yellow-400 hover:text-yellow-300 font-semibold text-sm flex items-center justify-center gap-2 mx-auto transition-colors group"
                    >
                        <ShieldCheckIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Moderatör Girişi</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
