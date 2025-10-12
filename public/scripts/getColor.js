/**
 * Trả về giá trị màu HSL dựa trên tỷ lệ mục tiêu hàng ngày.
 * @param {number} ratioDailyTarget - Tỷ lệ mục tiêu hàng ngày (0-100+).
 * 
 * Thang màu:
 * - 100%: xanh lá - hoàn thành mục tiêu hoặc vượt quá
 * - 90-99%: cam - gần đạt mục tiêu
 * - 67-89%: vàng - mức trung bình
 * - 0-66%: đỏ - mức thấp
 * - undefined: xám - không có dữ liệu
 */
function getColor(ratioDailyTarget) {
  return ratioDailyTarget >= 100 ? { light: 52.75, saturation: 65.15, hue: 124.97 } // xanh lá
    : ratioDailyTarget > 90 ? { light: 58.6, saturation: 89.6, hue: 30.5 } // cam
    : ratioDailyTarget > 66 ? { light: 59.2, saturation: 88.5, hue: 55.8 } // vàng
    : ratioDailyTarget === undefined ? { light: 75, saturation: 0, hue: 0 } // xám
    : { light: 59, saturation: 78, hue: 1.5 } // đỏ
}

export default getColor;