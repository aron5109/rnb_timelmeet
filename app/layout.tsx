import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fundargerðir Reykjanesbæjar',
  description: 'Leit og tímalína fundargerða bæjarstjórnar og nefnda Reykjanesbæjar',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="is">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
