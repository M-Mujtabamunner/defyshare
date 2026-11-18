// Homepage FAQ — rendered on the page and emitted as FAQPage JSON-LD at build time.
export const HOME_FAQ = [
  {
    q: 'Do I need an account?',
    a: 'No. Open DefyShare on each device and start sharing. There is nothing to sign up for and nothing to install.',
  },
  {
    q: 'How does it work?',
    a: 'Devices on the same Wi-Fi share a public IP address, so they join the same room automatically. When you drop a file, it is uploaded over HTTPS to temporary cloud storage and appears on every device in the room.',
  },
  {
    q: 'Who can see my files?',
    a: 'Devices in your room — in practice, devices on the same network (the same public IP address). People on other networks do not see them. Files are not end-to-end encrypted, so avoid sharing highly sensitive documents.',
  },
  {
    q: 'How long are files kept?',
    a: 'Every file and text is deleted automatically 3 hours after it is shared. You can delete anything sooner yourself.',
  },
  {
    q: 'What can I send, and how big?',
    a: 'Any file type — photos, videos, PDFs, ZIP, RAR, 7z, APK, documents — and whole folders, plus text and links. Each file can be up to 30 MB.',
  },
  {
    q: 'Does it need internet?',
    a: 'Yes. Files go through temporary cloud storage, so both devices need an internet connection.',
  },
  {
    q: 'Does it work on iPhone and Android?',
    a: 'Yes. It runs in any modern browser on Windows, macOS, Linux, Android, iOS and ChromeOS, and can be installed as an app.',
  },
];
