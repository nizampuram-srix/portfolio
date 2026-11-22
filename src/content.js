export const content = {
  name: 'Nizampuram Srivardhan',
  handle: 'srix',
  tagline: 'I build small apps that help real people.',
  about:
    '1st-year B.Tech CSE student at Anurag University, graduating 2030. Builds apps and tools, learning C and cybersecurity.',
  skills: ['C', 'Python', 'Flutter', 'Firebase', 'JavaScript', 'Cybersecurity basics'],
  skillGroups: [
    { title: 'Languages', items: ['Python', 'JavaScript', 'C'] },
    { title: 'Apps and backend', items: ['Flutter', 'Firebase'] },
    { title: 'Security', items: ['Cybersecurity basics'] },
  ],
  projects: [
    {
      id: 'anchor',
      title: 'Anchor',
      summary:
        'Flutter + Firebase home launcher for older people with dementia. Story Bank photos, Recall / Focus / Routine / Spot It games, Journey charts, Home Radius safe zone, Rakshak panic button, voice notes, Hindi + English, high contrast. SIH 2026 entry (team Neur0 Nex).',
      tags: ['Flutter', 'Firebase', 'Hindi + English', 'High contrast'],
      demoUrl: null, // Prompt 5 will put the demo link here
      links: [{ label: 'GitHub', href: 'https://github.com/nizampuram-srix' }],
    },
    {
      id: 'srix',
      title: 'Srix',
      summary:
        'Private file and text sharing on your own network. Python server, WebSockets, resumable chunked uploads, password rooms that auto-delete, QR share link, works through one tunnelled port.',
      tags: ['Python', 'WebSockets', 'Chunked uploads', 'QR share link'],
      note: 'Srix is self-hosted. It runs on your own network, so there is no live demo link.',
      screenshots: 3,
      links: [{ label: 'GitHub', href: 'https://github.com/nizampuram-srix' }],
    },
  ],
  timeline: [
    { when: '2023', title: 'Telangana at cycling nationals', text: 'Finished 25th.' },
    { when: '2026', title: 'Started B.Tech CSE', text: 'Anurag University.' },
    { when: '2026', title: 'Smart India Hackathon entry', text: 'Anchor, with team Neur0 Nex.' },
    { when: '2030', title: 'Graduation (expected)', text: 'B.Tech in Computer Science.' },
  ],
  funFact: 'Represented Telangana at cycling nationals in 2023 (finished 25th).',
  links: {
    linkedin: 'https://www.linkedin.com/in/srixardhan/',
    github: 'https://github.com/nizampuram-srix',
    email: 'Srixardhan@gmail.com',
  },
};