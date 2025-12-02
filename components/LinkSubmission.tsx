import React, { useState } from 'react';
import { Room, User } from '../types';
import { ShareIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface LinkSubmissionProps {
    room: Room;
    currentUser: User;
    onSubmitLink: (url: string, description: string) => void;
}

export const LinkSubmission: React.FC<LinkSubmissionProps> = ({
    room,
    currentUser,
    onSubmitLink
}) => {
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');

    const hasSubmitted = room.submissions.some(s => s.userId === currentUser.id);

    const handleSubmit = () => {
        if (!url.trim()) return;
        onSubmitLink(url, description);
        setUrl('');
        setDescription('');
    };

    if (hasSubmitted) {
        const userSubmission = room.submissions.find(s => s.userId === currentUser.id);

        return (
            <div className="max-w-2xl mx-auto p-4">
                <div className="bg-glass backdrop-blur-2xl p-8 rounded-3xl border border-white/10 text-center">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/20">
                        <ShareIcon className="w-10 h-10 text-green-400" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-3">Linkin Gönderildi! ✅</h2>
                    <p className="text-gray-400 mb-8">Moderatör oylamayı başlatana kadar bekle.</p>

                    <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Senin Linkin</div>
                        <div className="text-indigo-300 font-mono text-sm break-all">{userSubmission?.url}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="bg-glass backdrop-blur-2xl p-8 rounded-3xl border border-white/10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShareIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Linkini Gönder</h2>
                    <p className="text-gray-400 text-sm">En iyi linkle yarışmaya katıl!</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Web Sitesi Linki *</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Kısa Açıklama
                            <span className="text-gray-500 text-xs font-normal ml-2">(İsteğe bağlı)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Bu siteyi neden seçtin? Bizi ikna et..."
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none placeholder-gray-600"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!url.trim()}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl group"
                    >
                        <ShareIcon className="w-6 h-6" />
                        <span>Linkini Gönder</span>
                        <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};
