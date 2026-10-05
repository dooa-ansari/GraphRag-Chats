import { SITE } from '../seo'

const contact = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || 'hello@rehbarai.com'

export function Privacy() {
  return (
    <main className="narrow prose">
      <h1>Privacy</h1>
      <p className="lede">Last updated: 5 October 2026</p>
      <p>
        {SITE.name} runs this free course. We collect as little as we can, and we never sell your data or use it for
        advertising.
      </p>

      <h2>If you just read the course</h2>
      <p>
        We count visits with <a href="https://umami.is" target="_blank" rel="noopener noreferrer">Umami</a>, a privacy-friendly
        analytics tool. It does not use cookies and does not store your IP address. We see totals such as which pages
        were read, which country visitors come from, and what kind of device they use, but never who you are.
      </p>
      <p>
        Your progress and your light or dark mode choice are saved in your own browser. They never leave your device
        unless you log in.
      </p>

      <h2>If you log in</h2>
      <p>
        Logging in is optional and only used to keep your progress across devices. We store:
      </p>
      <ul>
        <li>your email address, to send you a login link;</li>
        <li>when you signed up and last logged in;</li>
        <li>which chapters you marked as complete, and when.</li>
      </ul>
      <p>
        This data is kept by <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a>, our database
        provider, in the EU region. Login emails are sent through our email provider. We never email you anything
        except the login links you ask for.
      </p>

      <h2>Deleting your data</h2>
      <p>
        Email <strong>{contact}</strong> from the address you log in with, and we will delete your account and progress
        within 30 days. You can also clear progress on this device any time by clearing this site's data in your
        browser.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this page or your data: <strong>{contact}</strong>
      </p>
    </main>
  )
}
