import { BRAND_MARK_PNG_BASE64 } from "./brand-mark";

export const BRAND_MARK_CID = "brand-mark@padosipro";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const COLOR = { page: "#FAFAF7", card: "#FFFFFF", text: "#101828", muted: "#667085", border: "#D0D5DD" };

export function otpEmail(code: string, validMinutes: number) {
  return {
    subject: `${code} is your PadosiPro verification code`,
    text: [
      "PadosiPro",
      "",
      `Your verification code is ${code}.`,
      `Enter it in the app to verify your email. It expires in ${validMinutes} minutes and works once.`,
      "",
      "If you didn't create a PadosiPro account, you can ignore this email.",
    ].join("\n"),
    html: otpEmailHtml(code, validMinutes),
    attachments: [
      {
        filename: "padosipro.png",
        content: Buffer.from(BRAND_MARK_PNG_BASE64, "base64"),
        cid: BRAND_MARK_CID,
        contentDisposition: "inline" as const,
      },
    ],
  };
}

// Table layout with inline styles so Gmail and Outlook render it the same; mirrors the app's verify screen.
function otpEmailHtml(code: string, validMinutes: number) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your PadosiPro verification code</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.page};">
<div style="display:none;max-height:0;overflow:hidden;">Your code is ${code}. It expires in ${validMinutes} minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.page};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:12px;">
        <tr>
          <td align="center" style="padding:32px 28px 0;font-family:${FONT};">
            <img src="cid:${BRAND_MARK_CID}" width="48" height="48" alt="PadosiPro" style="display:block;margin:0 auto;border:0;">
            <p style="margin:8px 0 0;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1px;color:${COLOR.muted};text-align:center;">PadosiPro</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 32px;font-family:${FONT};">
            <h1 style="margin:24px 0 0;font-size:26px;line-height:34px;font-weight:600;color:${COLOR.text};">Verify your email</h1>
            <p style="margin:12px 0 0;font-size:16px;line-height:24px;color:${COLOR.muted};">Enter this code in the PadosiPro app to finish creating your account.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td style="padding:12px 20px;border:1px solid ${COLOR.border};border-radius:12px;font-family:${FONT};font-size:32px;line-height:40px;font-weight:600;letter-spacing:8px;color:${COLOR.text};">${code}</td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:14px;line-height:20px;color:${COLOR.muted};">The code expires in ${validMinutes} minutes and works once.</p>
          </td>
        </tr>
      </table>
      <p style="max-width:480px;margin:16px auto 0;font-family:${FONT};font-size:13px;line-height:20px;color:${COLOR.muted};">If you didn't create a PadosiPro account, you can ignore this email.</p>
    </td>
  </tr>
</table>
</body>
</html>`;
}
