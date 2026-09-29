/**
 * يستخرج رسالة خطأ مفهومة من استجابة Strapi، مع fallback مناسب لحالة
 * انقطاع الشبكة وحالة عدم توفر رسالة من السيرفر.
 */
export function getErrorMessage(err, fallback = 'حدث خطأ غير متوقع') {
  if (!err) return fallback;

  // رسالة خطأ قادمة من Strapi (400/404/etc مع body منظم)
  const strapiMessage = err.response?.data?.error?.message;
  if (strapiMessage) return strapiMessage;

  // الطلب اترسل بس ما وصل رد (سيرفر واقع / لا يوجد إنترنت)
  if (err.request && !err.response) {
    return 'تعذر الاتصال بالسيرفر، تأكد من اتصالك بالإنترنت وحاول مجدداً';
  }

  return fallback;
}
