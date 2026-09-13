import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@socialpulse.com.au";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SocialPulse";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function baseTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:Inter,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <!-- Header -->
      <tr><td style="background:#18181B;padding:28px 40px;border-radius:12px 12px 0 0;">
        <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#FAFAF7;letter-spacing:-0.5px;">${APP_NAME}</span>
      </td></tr>
      <!-- Body -->
      <tr><td style="background:#FFFFFF;padding:40px;border:1px solid #E4E4DC;border-top:none;">
        ${content}
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:24px 40px;border:1px solid #E4E4DC;border-top:none;border-radius:0 0 12px 12px;background:#F4F4F0;">
        <p style="margin:0;font-size:12px;color:#71717A;line-height:1.6;">
          This email was sent by ${APP_NAME}. If you didn't request this, you can safely ignore it.<br/>
          &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#E8572A;color:#fff;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">${label}</a>`;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/auth/verify-email?token=${token}`;
  const html = baseTemplate(
    "Verify your email",
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, thanks for joining ${APP_NAME}. Click the button below to verify your email address and activate your account.</p>
    <p style="margin:0 0 32px;">${btn(url, "Verify email address")}</p>
    <p style="margin:0;font-size:13px;color:#71717A;">This link expires in <strong>24 hours</strong>. If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="margin:8px 0 0;font-size:12px;color:#E8572A;word-break:break-all;">${url}</p>`
  );

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Verify your ${APP_NAME} email address`,
    html,
  });
}

export async function sendRoleUpgradeEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/api/auth/verify-upgrade?token=${token}`;
  const html = baseTemplate(
    "Upgrade your account",
    `<div style="display:inline-block;background:#2D6A4F;color:#fff;font-size:11px;font-weight:700;letter-spacing:2px;padding:4px 12px;border-radius:4px;margin-bottom:20px;text-transform:uppercase;">Account Upgrade</div>
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Become a Business Owner</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, you requested to upgrade your ${APP_NAME} account to a Business Owner account.</p>
    <div style="border-left:3px solid #2D6A4F;padding:12px 20px;background:#F0FAF5;border-radius:0 8px 8px 0;margin:0 0 28px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#2D6A4F;text-transform:uppercase;letter-spacing:1px;">What you'll unlock</p>
      <ul style="margin:0;padding:0 0 0 16px;font-size:14px;color:#52525B;line-height:1.8;">
        <li>Create and manage a business listing</li>
        <li>Submit sponsored ads to promote your services</li>
        <li>Post campaigns for your community initiatives</li>
      </ul>
    </div>
    <p style="margin:0 0 32px;">${btn(url, "Confirm upgrade →")}</p>
    <p style="margin:0;font-size:13px;color:#71717A;">This link expires in <strong>24 hours</strong>. If you didn't request this upgrade, you can safely ignore this email — your account won't be changed.</p>
    <p style="margin:8px 0 0;font-size:12px;color:#A1A1AA;word-break:break-all;">${url}</p>`
  );

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Confirm your ${APP_NAME} account upgrade`,
    html,
  });
}

export async function sendRoleUpgradedEmail(email: string, name: string) {
  const html = baseTemplate(
    "You're now a Business Owner",
    `<div style="display:inline-block;background:#2D6A4F;color:#fff;font-size:11px;font-weight:700;letter-spacing:2px;padding:4px 12px;border-radius:4px;margin-bottom:20px;text-transform:uppercase;">Upgrade Complete</div>
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Welcome, Business Owner!</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, your account has been successfully upgraded. You can now create your business listing and start reaching the community.</p>
    <p style="margin:0 0 32px;">${btn(`${APP_URL}/business/create`, "Set up your business listing →")}</p>
    <p style="margin:0;font-size:13px;color:#71717A;">Need help getting started? Visit your dashboard to manage everything in one place.</p>`
  );

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your ${APP_NAME} account is now a Business Owner account`,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/auth/reset-password?token=${token}`;
  const html = baseTemplate(
    "Reset your password",
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, we received a request to reset your password. Click the button below to choose a new one.</p>
    <p style="margin:0 0 32px;">${btn(url, "Reset password")}</p>
    <p style="margin:0;font-size:13px;color:#71717A;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>`
  );

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html,
  });
}

export async function sendCampaignApprovedEmail(email: string, name: string, campaignTitle: string, campaignSlug: string) {
  const url = `${APP_URL}/campaigns/${campaignSlug}`;
  const html = baseTemplate(
    "Your campaign is live",
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Your campaign is live! 🎉</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, great news — your campaign <strong style="color:#18181B;">"${campaignTitle}"</strong> has been reviewed and approved by our team.</p>
    <p style="margin:0 0 32px;font-size:15px;color:#71717A;line-height:1.6;">It's now live on ${APP_NAME} and visible to the community. Share it widely to amplify your cause.</p>
    <p style="margin:0 0 32px;">${btn(url, "View your campaign")}</p>`
  );

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your campaign "${campaignTitle}" is now live on ${APP_NAME}`,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = baseTemplate(
    "Welcome to SocialPulse",
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Welcome to ${APP_NAME}!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, your email has been verified and your account is ready. Start by browsing campaigns or creating your own.</p>
    <p style="margin:0 0 32px;">${btn(`${APP_URL}/campaigns`, "Explore campaigns")}</p>`
  );
  await resend.emails.send({ from: FROM, to: email, subject: `Welcome to ${APP_NAME}`, html });
}

export async function sendBusinessApprovedEmail(email: string, name: string, businessName: string, businessSlug: string) {
  const url = `${APP_URL}/businesses/${businessSlug}`;
  const html = baseTemplate(
    "Your business is verified",
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Your business is verified! 🎉</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, great news — <strong style="color:#18181B;">${businessName}</strong> has been verified by our team and is now visible to the community.</p>
    <p style="margin:0 0 24px;font-size:15px;color:#71717A;line-height:1.6;">You can now also create and submit ads to be displayed across the platform.</p>
    <p style="margin:0 0 32px;">${btn(url, "View your business listing")}</p>`
  );
  await resend.emails.send({ from: FROM, to: email, subject: `Your business "${businessName}" is now verified on ${APP_NAME}`, html });
}

const CATEGORY_THEME: Record<string, { bg: string; accent: string; light: string }> = {
  "Environment":    { bg: "#064E3B", accent: "#10B981", light: "#ECFDF5" },
  "Education":      { bg: "#1E3A8A", accent: "#3B82F6", light: "#EFF6FF" },
  "Health":         { bg: "#881337", accent: "#F43F5E", light: "#FFF1F2" },
  "Animal Welfare": { bg: "#78350F", accent: "#F59E0B", light: "#FFFBEB" },
  "Human Rights":   { bg: "#3B0764", accent: "#A855F7", light: "#F5F3FF" },
  "Community":      { bg: "#134E4A", accent: "#14B8A6", light: "#F0FDFA" },
  "Arts & Culture": { bg: "#4A044E", accent: "#D946EF", light: "#FDF4FF" },
  "Poverty":        { bg: "#7C2D12", accent: "#F97316", light: "#FFF7ED" },
  "Disaster Relief":{ bg: "#7F1D1D", accent: "#EF4444", light: "#FEF2F2" },
  "Other":          { bg: "#1C1917", accent: "#A8A29E", light: "#F5F5F4" },
};

export async function sendCampaignJoinConfirmationEmail(
  email: string,
  name: string,
  campaign: {
    title: string;
    slug: string;
    category: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
    location: string | null;
    user: { name: string | null };
  }
) {
  const url = `${APP_URL}/campaigns/${campaign.slug}`;
  const theme = CATEGORY_THEME[campaign.category] ?? CATEGORY_THEME["Other"];
  const excerpt = campaign.description.length > 160
    ? campaign.description.slice(0, 157).trim() + "…"
    : campaign.description;

  const formatEmailDate = (d: Date | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-AU", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const startStr = formatEmailDate(campaign.startDate);
  const endStr   = formatEmailDate(campaign.endDate);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>You're officially in — ${campaign.title}</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F0;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

  <!-- Wordmark bar -->
  <tr><td style="background:#18181B;padding:20px 36px;border-radius:16px 16px 0 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#FAFAF7;letter-spacing:-0.5px;">${APP_NAME}</span>
        </td>
        <td align="right">
          <span style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#E8572A;border:1px solid #E8572A;padding:4px 10px;border-radius:40px;">Invitation</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Hero card -->
  <tr><td style="background:${theme.bg};padding:48px 36px 40px;">
    <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:${theme.accent};">${campaign.category}</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#FAFAF7;line-height:1.2;letter-spacing:-0.5px;">${campaign.title}</h1>
    <p style="margin:0;font-size:13px;color:rgba(250,250,247,0.55);letter-spacing:0.5px;">
      Organised by <span style="color:rgba(250,250,247,0.85);font-weight:600;">${campaign.user.name ?? "the SocialPulse community"}</span>
    </p>
  </td></tr>

  <!-- Ticket stub / confirmation strip -->
  <tr><td style="background:${theme.accent};padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:14px 36px;">
          <span style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fff;">✓ &nbsp;Registration confirmed</span>
        </td>
        <td align="right" style="padding:14px 36px;">
          <span style="font-size:12px;color:rgba(255,255,255,0.75);">${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#FFFFFF;padding:40px 36px;border:1px solid #E4E4DC;border-top:none;">

    <!-- Greeting -->
    <h2 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#18181B;letter-spacing:-0.3px;">Hi ${name ?? "there"} 👋</h2>
    <p style="margin:0 0 28px;font-size:15px;color:#52525B;line-height:1.7;">
      You're now part of <strong style="color:#18181B;">"${campaign.title}"</strong>. Your registration is confirmed and the campaign organiser has been notified. Thank you for taking a stand on what matters.
    </p>

    <!-- Campaign excerpt -->
    <div style="background:${theme.light};border-left:3px solid ${theme.accent};padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 32px;">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;font-style:italic;">"${excerpt}"</p>
    </div>

    ${(startStr || campaign.location) ? `
    <!-- Event details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;background:#FAFAF7;border:1px solid #E4E4DC;border-radius:12px;overflow:hidden;">
      ${startStr ? `
      <tr>
        <td style="padding:14px 20px;border-bottom:${campaign.location ? "1px solid #E4E4DC" : "none"};">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;vertical-align:top;">
                <div style="width:36px;height:36px;background:${theme.light};border-radius:8px;text-align:center;line-height:36px;font-size:16px;">📅</div>
              </td>
              <td style="vertical-align:top;">
                <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A1A1AA;">Event date</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#18181B;">${startStr}</p>
                ${endStr ? `<p style="margin:2px 0 0;font-size:12px;color:#71717A;">Until ${endStr}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>` : ""}
      ${campaign.location ? `
      <tr>
        <td style="padding:14px 20px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;vertical-align:top;">
                <div style="width:36px;height:36px;background:${theme.light};border-radius:8px;text-align:center;line-height:36px;font-size:16px;">📍</div>
              </td>
              <td style="vertical-align:top;">
                <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A1A1AA;">Location</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#18181B;">${campaign.location}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>` : ""}
    </table>` : ""}

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="border-radius:10px;background:#E8572A;">
          <a href="${url}" style="display:inline-block;background:#E8572A;color:#fff;font-size:15px;font-weight:700;padding:16px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">View campaign &rarr;</a>
        </td>
      </tr>
    </table>

    <!-- Share nudge -->
    <div style="background:#F4F4F0;border-radius:10px;padding:20px 24px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#18181B;">Spread the word</p>
      <p style="margin:0;font-size:13px;color:#71717A;line-height:1.6;">The more people know, the bigger the impact. Share this campaign with your network and help the cause grow.</p>
    </div>

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 36px;background:#F4F4F0;border:1px solid #E4E4DC;border-top:none;border-radius:0 0 16px 16px;">
    <p style="margin:0 0 4px;font-size:12px;color:#71717A;line-height:1.6;">
      This email was sent because you joined a campaign on <strong>${APP_NAME}</strong>.
    </p>
    <p style="margin:0;font-size:12px;color:#A1A1AA;">&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You're in — "${campaign.title}" on ${APP_NAME}`,
    html,
  });
}

export async function sendCampaignJoinNotificationEmail(ownerEmail: string, ownerName: string, campaignTitle: string, campaignSlug: string, joinerName: string, joinerEmail: string) {
  const url = `${APP_URL}/campaigns/${campaignSlug}/registrations`;
  const html = baseTemplate(
    "Someone joined your campaign",
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">New participant!</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${ownerName ?? "there"}, <strong style="color:#18181B;">${joinerName}</strong> (${joinerEmail}) has just joined your campaign <strong style="color:#18181B;">"${campaignTitle}"</strong>.</p>
    <p style="margin:0 0 32px;">${btn(url, "View all participants")}</p>`
  );
  await resend.emails.send({ from: FROM, to: ownerEmail, subject: `${joinerName} joined your campaign "${campaignTitle}"`, html });
}

export async function sendAdApprovedEmail(email: string, name: string, adTitle: string, _businessSlug: string) {
  const url = `${APP_URL}/business/ads`;
  const html = baseTemplate(
    "Your ad is live",
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Your ad is live! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, your ad <strong style="color:#18181B;">"${adTitle}"</strong> has been approved and is now being displayed across ${APP_NAME}.</p>
    <p style="margin:0 0 32px;">${btn(url, "Manage your ads")}</p>`
  );
  await resend.emails.send({ from: FROM, to: email, subject: `Your ad "${adTitle}" is now live on ${APP_NAME}`, html });
}

export async function sendAdRejectedEmail(email: string, name: string, adTitle: string, reason: string) {
  const url = `${APP_URL}/business/ads`;
  const html = baseTemplate(
    "Ad update",
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Ad update</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, your ad <strong style="color:#18181B;">"${adTitle}"</strong> could not be approved at this time.</p>
    <div style="background:#FFF5F2;border-left:4px solid #E8572A;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;color:#18181B;line-height:1.6;"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p style="margin:0 0 32px;font-size:15px;color:#71717A;line-height:1.6;">You can delete it and submit a new one that addresses the feedback.</p>
    <p style="margin:0 0 32px;">${btn(url, "Manage your ads")}</p>`
  );
  await resend.emails.send({ from: FROM, to: email, subject: `Update on your ad "${adTitle}"`, html });
}

export async function sendCampaignRejectedEmail(email: string, name: string, campaignTitle: string, reason: string) {
  const html = baseTemplate(
    "Campaign update",
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#18181B;letter-spacing:-0.5px;">Campaign update</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#71717A;line-height:1.6;">Hi ${name ?? "there"}, after reviewing your campaign <strong style="color:#18181B;">"${campaignTitle}"</strong>, our team was unable to approve it at this time.</p>
    <div style="background:#FFF5F2;border-left:4px solid #E8572A;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;color:#18181B;line-height:1.6;"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p style="margin:0 0 24px;font-size:15px;color:#71717A;line-height:1.6;">You're welcome to edit your campaign to address the feedback and resubmit it for review.</p>
    <p style="margin:0 0 32px;">${btn(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, "Go to dashboard")}</p>`
  );

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Update on your campaign "${campaignTitle}"`,
    html,
  });
}
