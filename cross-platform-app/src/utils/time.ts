export const humanizeTime = (isoString: string | null, language: string): string => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    const intervals: { [key: string]: number } = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
    };

    for (const intervalName in intervals) {
        const interval = intervals[intervalName];
        if (seconds >= interval) {
            const count = Math.floor(seconds / interval);
            // Basic pluralization
            const unit = language === 'ar' ? getArabicUnit(intervalName, count) : `${intervalName}${count !== 1 ? 's' : ''}`;
             if (language === 'ar') {
                return `منذ ${count} ${unit}`;
             }
            return `${count} ${unit} ago`;
        }
    }
    return language === 'ar' ? 'الآن' : 'just now';
}

const getArabicUnit = (unit: string, count: number) => {
    if (count === 1) return ARABIC_UNITS[unit]?.one ?? unit;
    if (count === 2) return ARABIC_UNITS[unit]?.two ?? unit;
    if (count >= 3 && count <= 10) return ARABIC_UNITS[unit]?.few ?? unit;
    return ARABIC_UNITS[unit]?.many ?? unit;
};

const ARABIC_UNITS: { [key: string]: { one: string; two: string; few: string; many: string } } = {
    year: { one: 'سنة', two: 'سنتين', few: 'سنوات', many: 'سنة' },
    month: { one: 'شهر', two: 'شهرين', few: 'أشهر', many: 'شهرًا' },
    day: { one: 'يوم', two: 'يومين', few: 'أيام', many: 'يومًا' },
    hour: { one: 'ساعة', two: 'ساعتين', few: 'ساعات', many: 'ساعة' },
    minute: { one: 'دقيقة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' },
    second: { one: 'ثانية', two: 'ثانيتين', few: 'ثوان', many: 'ثانية' },
};


export const formatFullDateTime = (isoString: string | null, language: string): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'N/A';
    }
};
