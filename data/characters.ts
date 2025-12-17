export interface GameCharacter {
  id: string; // 1-88 string
  name: string;
  image: string; // path to png in public folder e.g. "/avatars/1.png"
  color: string; // Tailwind class fallback
}

const COLORS = [
  "bg-red-500", "bg-blue-600", "bg-green-600", "bg-yellow-500", "bg-purple-600", "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-cyan-600"
];

// 88 Spesifik Karakter (Kullanıcının görsellerine göre isimlendirilmiş)
// Kullanıcı resimlerini 'public/avatars/' klasörüne 1.png'den 88.png'ye kadar kaydetmelidir.
const CHARACTER_LIST = [
  // --- KORSANLAR ---
  { name: "Mor Bandanalı Korsan", file: "1.png" },
  { name: "Kaptan Kuru Kafa", file: "2.png" },
  { name: "Korsan Jack", file: "3.png" },
  { name: "Tek Gözlü Korsan", file: "4.png" },
  { name: "Kırmızı Başlıklı Korsan", file: "5.png" },
  { name: "Mavi Korsan", file: "6.png" },
  { name: "Korsan Şapkası", file: "7.png" },
  { name: "Sakallı Reis", file: "8.png" },

  // --- UZAY & BİLİM ---
  { name: "Astronot Çocuk", file: "9.png" },
  { name: "Kasklı Astronot", file: "10.png" },
  { name: "Yeşil Vizörlü Astronot", file: "11.png" },
  { name: "Gülümseyen Astronot", file: "12.png" },
  { name: "Uzaylı Ziyaretçi", file: "13.png" },
  { name: "Yeşil Uzaylı", file: "14.png" },
  { name: "Tek Gözlü Uzaylı", file: "15.png" },
  { name: "Çılgın Bilim İnsanı", file: "16.png" },

  // --- ROBOTLAR ---
  { name: "Mavi Robot", file: "17.png" },
  { name: "Turuncu Robot", file: "18.png" },
  { name: "Yeşil Robot", file: "19.png" },
  { name: "Dişli Robot", file: "20.png" },
  { name: "Retro Robot", file: "21.png" },
  { name: "Siber Robot", file: "22.png" },
  { name: "Kutu Kafa Robot", file: "23.png" },
  { name: "Antenli Robot", file: "24.png" },

  // --- MESLEKLER ---
  { name: "Polis Memuru", file: "25.png" },
  { name: "İtfaiyeci", file: "26.png" },
  { name: "Doktor Bey", file: "27.png" },
  { name: "Doktor Hanım", file: "28.png" },
  { name: "Hemşire", file: "29.png" },
  { name: "Pilot", file: "30.png" },
  { name: "Şef Aşçı", file: "31.png" },
  { name: "İnşaatçı", file: "32.png" },
  { name: "Dedektif", file: "33.png" },
  { name: "Ressam", file: "34.png" },
  { name: "Müzisyen", file: "35.png" },
  { name: "Sihirbaz", file: "36.png" },
  { name: "Hakem", file: "37.png" },
  { name: "Basketbolcu", file: "38.png" },
  { name: "Beyzbolcu", file: "39.png" },
  { name: "Dalgıç", file: "40.png" },

  // --- FANTASTİK & KOSTÜM ---
  { name: "Kral", file: "41.png" },
  { name: "Kraliçe", file: "42.png" },
  { name: "Prens", file: "43.png" },
  { name: "Prenses", file: "44.png" },
  { name: "Ninja", file: "45.png" },
  { name: "Süper Kahraman", file: "46.png" },
  { name: "Peri Kızı", file: "47.png" },
  { name: "Büyücü", file: "48.png" },
  { name: "Cadı", file: "49.png" },
  { name: "Vampir", file: "50.png" },
  { name: "Kurt Adam", file: "51.png" },
  { name: "Zombi", file: "52.png" },
  { name: "Hayalet", file: "53.png" },
  { name: "Mumya", file: "54.png" },
  { name: "Palyaço", file: "55.png" },
  { name: "Viking", file: "56.png" },
  { name: "Kovboy", file: "57.png" },
  { name: "Kızılderili", file: "58.png" },
  { name: "Cin", file: "59.png" },
  { name: "Firavun", file: "60.png" },

  // --- HAYVANLAR ---
  { name: "Aslan", file: "61.png" },
  { name: "Kaplan", file: "62.png" },
  { name: "Mor Kedi", file: "63.png" },
  { name: "Turuncu Kedi", file: "64.png" },
  { name: "Gözlüklü Kedi", file: "65.png" },
  { name: "Sevimli Köpek", file: "66.png" },
  { name: "Mavi Köpek", file: "67.png" },
  { name: "Panda", file: "68.png" },
  { name: "Zebra", file: "69.png" },
  { name: "Zürafa", file: "70.png" },
  { name: "Fil", file: "71.png" },
  { name: "Maymun", file: "72.png" },
  { name: "Penguen", file: "73.png" },
  { name: "Ejderha", file: "74.png" },
  { name: "Oduncu", file: "75.png" }, // Görsellerde arada vardı
  
  // --- YİYECEK & NESNE ---
  { name: "Hamburger Kafa", file: "76.png" },
  { name: "Pizza Dilimi", file: "77.png" },
  { name: "Çilekli Kek", file: "78.png" },
  { name: "Bal Kabağı", file: "79.png" },
  { name: "Kardan Adam", file: "80.png" },
  { name: "Bulut", file: "81.png" },
  { name: "Güneş", file: "82.png" },
  { name: "Ay", file: "83.png" },
  { name: "Yıldız", file: "84.png" },
  { name: "Deniz Kızı", file: "85.png" },
  { name: "Ananas", file: "86.png" }, // Extra
  { name: "Çilek", file: "87.png" }, // Extra
  { name: "Karpuz", file: "88.png" }  // Extra
];

export const CHARACTER_POOL: GameCharacter[] = CHARACTER_LIST.map((char, index) => ({
  id: String(index + 1),
  name: char.name,
  image: `/avatars/${char.file}`, // Assumes images are in public/avatars/
  color: COLORS[index % COLORS.length]
}));