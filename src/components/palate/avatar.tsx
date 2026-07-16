export function Avatar({
  initials = 'P',
  tone = 'olive',
  small = false,
}: {
  initials?: string
  tone?: string
  small?: boolean
}) {
  return <span className={`avatar ${tone} ${small ? 'small' : ''}`}>{initials}</span>
}
