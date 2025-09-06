import { Temporal } from 'temporal-polyfill'

/**
 * Định dạng khoảng ngày từ chuỗi ISO sang định dạng tiếng Việt.
 * Ví dụ:
 * startDate: 2025-07-21, endDate: 2025-07-27 -> 21 - 27 tháng Bảy, 2025
 * startDate: 2025-07-28, endDate: 2025-08-03 -> 28 tháng Bảy - 3 tháng Tám, 2025
 * startDate: 2025-08-04, endDate: 2025-08-10 -> 4 - 10 tháng Tám, 2025
 * startDate: 2025-08-11, endDate: 2025-08-17 -> 11 - 17 tháng Tám, 2025
 * startDate: 2025-08-18, endDate: 2025-08-24 -> 18 - 24 tháng Tám, 2025
 * startDate: 2025-08-25, endDate: 2025-08-31 -> 25 - 31 tháng Tám, 2025
 * startDate: 2025-09-01, endDate: 2025-09-07 -> 1 - 9tháng Chín , 2025
 * 
 * @param {string} startDateStr - Ngày bắt đầu ở định dạng ISO (YYYY-MM-DD)
 * @param {string} endDateStr - Ngày kết thúc ở định dạng ISO (YYYY-MM-DD)
 * @returns {string} Khoảng ngày đã được định dạng
 *
*/
export function formatDateRange(startDateStr, endDateStr) {
    // Tạo Temporal.PlainDate từ chuỗi ISO
    const startDate = Temporal.PlainDate.from(startDateStr);
    const endDate = Temporal.PlainDate.from(endDateStr);
    
    // Danh sách tên tháng tiếng Việt
    const monthNames = [
        'tháng Một', 'tháng Hai', 'tháng Ba', 'tháng Tư',
        'tháng Năm', 'tháng Sáu', 'tháng Bảy', 'tháng Tám',
        'tháng Chín', 'tháng Mười', 'tháng Mười một', 'tháng Mười hai'
    ];
    
    const startDay = startDate.day;
    const endDay = endDate.day;
    const startMonth = monthNames[startDate.month - 1];
    const endMonth = monthNames[endDate.month - 1];
    const startYear = startDate.year;
    const endYear = endDate.year;
    
    // Kiểm tra các trường hợp khác nhau
    if (startYear !== endYear) {
        // Khác năm
        return `${startDay} ${startMonth}, ${startYear} - ${endDay} ${endMonth}, ${endYear}`;
    } else if (startDate.month !== endDate.month) {
        // Cùng năm, khác tháng
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}, ${startYear}`;
    } else {
        // Cùng tháng
        return `${startDay} - ${endDay} ${startMonth}, ${startYear}`;
    }
}
