// "Add to home screen": Android Chrome offers its own install prompt, which we keep to show on a button;
// iPhone has none, so Settings explains the Share menu instead.
type InstallPrompt = Event & { prompt: () => Promise<void> }
let deferred: InstallPrompt | null = null
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallPrompt })
addEventListener('appinstalled', () => { deferred = null })

export const installed = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
export const isIPhone = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const canPrompt = () => deferred !== null
export async function promptInstall() {
  const e = deferred
  deferred = null // the browser allows each prompt once
  await e?.prompt()
}
