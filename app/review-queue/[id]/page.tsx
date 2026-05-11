import { redirect } from 'next/navigation'

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
  redirect(`/review-queue?selected=${encodeURIComponent(params.id)}`)
}
