export function isSafariOnIOS(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();

  const isSafari =
    ua.includes("safari") &&
    !ua.includes("crios") &&
    !ua.includes("fxios") &&
    !ua.includes("edgios");

  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isIPadOS = /macintosh/.test(ua) && navigator.maxTouchPoints > 1;

  return (isIOS || isIPadOS) && isSafari;
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isIPadOS = /macintosh/.test(ua) && navigator.maxTouchPoints > 1;

  return isIOS || isIPadOS;
}
