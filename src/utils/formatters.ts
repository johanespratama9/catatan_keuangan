export const formatRupiah = (amount: number, withPrefix: boolean = true): string => {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('id-ID');
  return withPrefix ? `Rp ${formatted}` : formatted;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compareDate = new Date(dateObj);
  compareDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari Ini';
  if (diffDays === 1) return 'Kemarin';

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${day} ${month} ${year}`;
};

export const formatFullDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = days[dateObj.getDay()];
  const day = dateObj.getDate();
  const monthName = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${dayName}, ${day} ${monthName} ${year}`;
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex] || '';
};

export const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
