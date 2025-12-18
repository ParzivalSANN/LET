
import React, { useState } from 'react';

interface Props {
  onAuth: (schoolNo: string, p: string, isRegister: boolean, realName?: string) => void;
}

const LoginView: React.FC<Props> = ({ onAuth }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [schoolNo, setSchoolNo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolNo && password) {
        onAuth(schoolNo, password, isRegister, realName);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="bg-[#0f172a]/95 backdrop-blur-2xl p-8 md:p-10 rounded-[3rem] border border-white/10 w-full max-w-md shadow-2xl relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">
            WebIn<span className="text-amber-500">Royale</span>
          </h1>
          <p className="text-gray-400 text-sm">{isRegister ? 'Yeni Savaşçı Kaydı' : 'Arenaya Giriş'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text"
            placeholder="Okul Numarası"
            value={schoolNo}
            onChange={e => setSchoolNo(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
          />
          
          {isRegister && (
            <input 
              type="text"
              placeholder="Gerçek Ad Soyad"
              value={realName}
              onChange={e => setRealName(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
            />
          )}

          <input 
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
          />

          <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest mt-4">
            {isRegister ? 'Kayıt Ol' : 'Savaşa Gir'}
          </button>
        </form>

        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-6 text-gray-500 text-xs hover:text-white transition-colors"
        >
          {isRegister ? 'Giriş ekranına dön' : 'Henüz kaydolmadın mı? Yeni hesap aç'}
        </button>
      </div>
    </div>
  );
};

export default LoginView;
