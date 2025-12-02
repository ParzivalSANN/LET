import React from 'react';
import { Room, User, RoomStatus } from '../types';
import { QrCodeIcon, UserGroupIcon, LinkIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface WaitingRoomProps {
    room: Room;
    currentUser: User;
    isMod: boolean;
    onStartVoting: () => void;
    onCancelRoom: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
    room,
    currentUser,
    isMod,
    onStartVoting,
    onCancelRoom
}) => {
    const submittedCount = room.submissions?.length || 0;
    const totalUsers = room.users?.filter(u => !u.isMod).length || 0;
    const canStart = submittedCount >= 2; // At least 2 links needed

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="bg-glass backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                            {isMod ? 'Bekleme Odası' : 'Oyun Başlamayı Bekliyor'}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {isMod ? 'Katılımcılar linklerini gönderiyor...' : 'Admin oylamayı başlatacak...'}
                        </p>
                    </div>

                    {isMod && (
                        <button
                            onClick={onCancelRoom}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-xl transition-all"
                            title="Yarışmayı İptal Et"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* PIN Display (Only for Moderator) */}
                {isMod && (
                    <div className="mb-10 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-8 rounded-3xl border border-indigo-500/30 text-center">
                        <p className="text-indigo-300 text-sm font-bold uppercase tracking-wider mb-3">Oda Kodu</p>
                        <div className="text-7xl md:text-8xl font-black text-white tracking-[0.3em] mb-4">
                            {room.pin}
                        </div>
                        <p className="text-gray-400 text-sm">Katılımcılar bu kodu girerek katılabilir</p>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5 text-center">
                        <UserGroupIcon className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                        <div className="text-4xl font-black text-white mb-1">{totalUsers}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Katılımcı</div>
                    </div>

                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5 text-center">
                        <LinkIcon className="w-10 h-10 text-green-400 mx-auto mb-3" />
                        <div className="text-4xl font-black text-white mb-1">{submittedCount}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Link Toplandı</div>
                    </div>
                </div>

                {/* Participants List */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-gray-400" />
                        Katılımcılar ({room.users?.filter(u => !u.isMod).length || 0})
                    </h3>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {room.users?.filter(u => !u.isMod).map((user) => {
                            const hasSubmitted = room.submissions?.some(s => s.userId === user.id) || false;

                            return (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between bg-gray-800/40 p-4 rounded-xl border border-white/5 transition-all hover:border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">
                                                {user.name}
                                                {user.id === currentUser.id && (
                                                    <span className="text-gray-500 font-normal ml-2">(Sen)</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">Katılımcı</div>
                                        </div>
                                    </div>

                                    <div>
                                        {hasSubmitted ? (
                                            <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                                <CheckCircleIcon className="w-5 h-5" />
                                                Link Gönderildi
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <ClockIcon className="w-5 h-5 animate-pulse" />
                                                Bekleniyor
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Moderator Controls */}
                {isMod && (
                    <div className="bg-yellow-900/10 border border-yellow-500/20 p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-yellow-500 font-bold text-sm uppercase tracking-wider">Moderatör Paneli</h4>
                                <p className="text-gray-400 text-xs mt-1">
                                    {canStart
                                        ? 'Hazırsın! Oylamayı başlatabilirsin.'
                                        : `En az 2 link gerekli (Şu an: ${submittedCount})`
                                    }
                                </p>
                            </div>
                            <div className="text-2xl font-black text-white">
                                {submittedCount}/{totalUsers}
                            </div>
                        </div>

                        <button
                            onClick={onStartVoting}
                            disabled={!canStart}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl group"
                        >
                            {canStart ? (
                                <>
                                    <span>Oylamayı Başlat</span>
                                    <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </>
                            ) : (
                                <>
                                    <ClockIcon className="w-6 h-6 animate-pulse" />
                                    <span>Linkler Bekleniyor...</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
